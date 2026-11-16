import { OrbitLineList, Color, Vector3d, Matrix3d, Planets, WWTControl } from "@wwtelescope/engine";
import type { SolarSystemObjects } from "@wwtelescope/engine-types";
import type { HorizonsVector } from "./horizons";
import type { Vec3 } from "./hermite";
import { densifiedRows, j2000PositionAt, splitAtSeams } from "./trajectory";
import { precessEclipticDateToJ2000, precessionMatrix } from "./precession";

// the line colour is in the vertices; the shader multiplies it by this
const WHITE = Color.fromHex("#ffffff");
const ORIGIN: Vec3 = { x: 0, y: 0, z: 0 };
/** lines stay within 3 km of the Hermite curve, up to ~5 km on 64-day knots (1–1.5 px at the closest zoom) */
export const LINE_TOLERANCE_AU = 3 / 149597870.7;
// line vertices are float32, good to ~6e-8 of their distance from the line's center: keep the center within this × zoom
// of the camera target (0.1 au at the closest zoom), a quarter pixel at any zoom
const RECENTER_AU_PER_ZOOM = 1700;

/** An OrbitLineList through J2000 rows, in WWT's (x, z, y) order, relative to `center` (in doubles, so the float32 vertices stay small) */
export function createOrbitLineList(vectors: Vec3[], colorHex = "#ffffff", center: Vec3 = ORIGIN): OrbitLineList {
  const lineList = new OrbitLineList();
  const color = Color.fromHex(colorHex);
  const points = vectors.map((v) => Vector3d.create(v.x - center.x, v.z - center.z, v.y - center.y));
  for (let i = 1; i < points.length; i++) {
    lineList.addLine(points[i - 1], points[i], color, color);
  }
  return lineList;
}

/**
 * Where WWT draws `body`'s center in the solar system scene (x, z, y order).
 * The scene is drawn relative to viewTarget: the tracked object plus its radius toward the camera.
 */
export function bodyCenterInScene(body: SolarSystemObjects): Vector3d {
  const viewTarget = WWTControl.singleton.renderContext.viewCamera.viewTarget;
  return Vector3d.subtractVectors(Planets.getPlanet3dLocation(body), viewTarget);
}

/**
 * Draw a line list of J2000 points relative to `center` in `frame`: world = rotation (e.g. precessionMatrix(tdbNow())),
 * then translation to the frame's center plus the rotated `center`, in doubles. Call from a frame callback.
 */
export function drawOrbitLineInFrame(
  lineList: OrbitLineList,
  frame: SolarSystemObjects,
  rotation = Matrix3d.get_identity(),
  center: Vec3 = ORIGIN,
) {
  const ctx = WWTControl.singleton.renderContext;
  const c = rotation.transform(Vector3d.create(center.x, center.z, center.y));
  const o = bodyCenterInScene(frame);
  const offset = Matrix3d.translation(Vector3d.create(c.x + o.x, c.y + o.y, c.z + o.z));
  const world = ctx.get_world();
  ctx.set_world(Matrix3d.multiplyMatrix(Matrix3d.multiplyMatrix(rotation, offset), world));
  lineList.drawLines(ctx, 1, WHITE);
  ctx.set_world(world);
}

/** the camera target (the scene's origin) as a J2000 point relative to `frame` */
function viewTargetInFrame(frame: SolarSystemObjects, jdtdb: number): Vec3 {
  const o = bodyCenterInScene(frame);
  const [x, y, z] = precessEclipticDateToJ2000(-o.x, -o.z, -o.y, jdtdb);
  return { x, y, z };
}

/** points per line list in a trajectory line; consecutive chunks share their end point, so the line stays continuous */
const CHUNK_POINTS = 512;

/** a run cut into time-ordered chunks of at most CHUNK_POINTS points (each at least 2) */
function chunksOf(run: HorizonsVector[]): HorizonsVector[][] {
  const chunks: HorizonsVector[][] = [];
  for (let i = 0; i < run.length - 1; i += CHUNK_POINTS - 1) {
    chunks.push(run.slice(i, i + CHUNK_POINTS));
  }
  return chunks;
}

export interface TrajectoryLine {
  /**
   * J2000 points relative to the line's frame: each run between seams, densified, then cut into chunks in time order,
   * so the line can be drawn up to a time with whole chunks plus one partial chunk
   */
  chunks: HorizonsVector[][];
  colorHex: string;
  /** the vertices are relative to this (J2000, relative to the frame), near the camera target */
  center: Vec3;
  /** one per chunk */
  lineLists: OrbitLineList[];
  /** the J2000 position at a UT time (ms), the same Hermite the spacecraft is placed with, so the line ends on it */
  positionAt: (t: number) => HorizonsVector | null;
  /** the chunk the drawing time falls in, through the points before it and the position at it */
  partial: { chunk: number; untilMs: number; lineList: OrbitLineList } | null;
}

/** A line through J2000 rows with velocities: no segment across a seam, and densified to stay within tolAu of the Hermite */
export function createTrajectoryLine(vectors: HorizonsVector[], tolAu: number, colorHex = "#ffffff"): TrajectoryLine {
  const chunks = splitAtSeams(vectors).flatMap((rows) => chunksOf(densifiedRows(rows, tolAu)));
  return { chunks, colorHex, center: ORIGIN, lineLists: [], positionAt: j2000PositionAt(vectors), partial: null };
}

/** the line list for chunk i drawn up to untilMs (strictly inside the chunk), rebuilt only when the chunk or time changes */
function partialLineList(line: TrajectoryLine, i: number, untilMs: number): OrbitLineList {
  if (line.partial && line.partial.chunk === i && line.partial.untilMs === untilMs) {
    return line.partial.lineList;
  }
  line.partial?.lineList.clear();
  const chunk = line.chunks[i];
  const points: Vec3[] = [];
  for (const v of chunk) {
    if (v.date.getTime() > untilMs) {
      break;
    }
    points.push(v);
  }
  const end = line.positionAt(untilMs);
  if (end) {
    points.push(end);
  }
  const lineList = createOrbitLineList(points, line.colorHex, line.center);
  line.partial = { chunk: i, untilMs, lineList };
  return lineList;
}

/**
 * Draw a trajectory line in `frame` at TDB jdtdb (rotated to that date's ecliptic), only up to the UT time untilMs
 * (e.g. WWT's current time, so it ends at the spacecraft; Infinity for the whole line). Relative to the frame's center,
 * the float32 vertices near a camera far out (following Voyager) were tens to hundreds of px off, or culled. So they're
 * kept relative to a point near the camera target, and rebuilt when the target moves too far from it for the zoom.
 */
export function drawTrajectoryLineInFrame(
  line: TrajectoryLine,
  frame: SolarSystemObjects,
  jdtdb: number,
  untilMs = Infinity,
) {
  const target = viewTargetInFrame(frame, jdtdb);
  const c = line.center;
  const recenterAu = RECENTER_AU_PER_ZOOM * WWTControl.singleton.renderContext.viewCamera.zoom;
  if (line.lineLists.length === 0 || Math.hypot(target.x - c.x, target.y - c.y, target.z - c.z) > recenterAu) {
    // clear() frees the GL buffers
    line.lineLists.forEach((lineList) => lineList.clear());
    line.partial?.lineList.clear();
    line.partial = null;
    line.center = target;
    line.lineLists = line.chunks.map((chunk) => createOrbitLineList(chunk, line.colorHex, target));
  }
  const rotation = precessionMatrix(jdtdb);
  line.chunks.forEach((chunk, i) => {
    if (chunk[chunk.length - 1].date.getTime() <= untilMs) {
      drawOrbitLineInFrame(line.lineLists[i], frame, rotation, line.center);
    } else if (chunk[0].date.getTime() < untilMs) {
      drawOrbitLineInFrame(partialLineList(line, i, untilMs), frame, rotation, line.center);
    }
  });
}
