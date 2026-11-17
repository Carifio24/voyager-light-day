import { WWTControl, type SpreadSheetLayer } from "@wwtelescope/engine";
import { SolarSystemObjects } from "@wwtelescope/engine-types";
import type { engineStore } from "@wwtelescope/engine-pinia";
import type { HorizonsVector } from "./horizons";
import { HorizonsVectorTable } from "./HorizonsVectorTable";
import { tdbNow } from "./horizons_helpers";
import { precessionMatrix } from "./precession";
import { densifiedRows, j2000PositionAt, precessedToTime } from "./trajectory";
import { bodyCenterInScene, createOrbitLineList, drawOrbitLineInFrame, LINE_TOLERANCE_AU } from "./orbitLine";
import { createMovingMarkerLayer } from "./horizonsSpreadsheet";

// Titan around the Sun, like Voyager: one orbit at 6 h steps centered on the Titan flyby. Moved to WWT's Saturn
// per row, the marker lands on Horizons' heliocentric Titan, so it meets Voyager (WWT's Saturn is ~6,000 km off)
import titanData from "@/assets/horizons_titan-sun.txt?raw";
import mirandaData from "@/assets/horizons_miranda-uranus.txt?raw";

type EngineStore = ReturnType<typeof engineStore>;

const SATURN = SolarSystemObjects.saturn;
const TITAN_COLOR = "#ffa000";
const MIRANDA_COLOR = "#dccfff";
const DAY_MS = 86400000;

interface MoonDefinition {
  name: string;
  table: HorizonsVectorTable;
  /** mean period (days), from https://ssd.jpl.nasa.gov/sats/elem/sep.html */
  periodDays: number;
  color: string;
  parent: SolarSystemObjects;
  /** the moon's marker and orbit line show only while the camera is within this distance (au) of its parent */
  nearParentAu: number;
}

const SATURN_MOONS: MoonDefinition[] = [
  {
    name: "Titan",
    table: new HorizonsVectorTable(titanData),
    periodDays: 15.945448,
    color: TITAN_COLOR,
    parent: SATURN,
    nearParentAu: 1,
  },
];

const URANUS_MOONS: MoonDefinition[] = [
  {
    name: "Miranda",
    table: new HorizonsVectorTable(mirandaData),
    periodDays: 1.413479,
    color: MIRANDA_COLOR,
    parent: SolarSystemObjects.uranus,
    nearParentAu: 0.1,
  },
];

/** shift t (ms) by whole periods so it lands in [start, start + period), and not past the table's end */
function wrapTimeToOrbit(t: number, start: number, end: number, period: number): number {
  return Math.min(t - Math.floor((t - start) / period) * period, end);
}

/**
 * A moon's position relative to Saturn at a UT time (ms): the Hermite at the time wrapped into its one-orbit table,
 * precessed to the time's ecliptic. Inside the table (Titan's flyby) the wrapped time is the time.
 */
function moonPositionAt(table: HorizonsVectorTable, periodDays: number, parent: SolarSystemObjects) {
  const [start, end] = [table.timeSpan.start.getTime(), table.timeSpan.end.getTime()];
  const at = j2000PositionAt(table.j2000(parent));
  return (t: number): HorizonsVector | null => {
    const v = at(wrapTimeToOrbit(t, start, end, periodDays * DAY_MS));
    return v && precessedToTime(v, t);
  };
}

/** the camera's distance (au) from a body this frame */
function distanceFromCamera(body: SolarSystemObjects): number {
  const b = bodyCenterInScene(body);
  const c = WWTControl.singleton.renderContext.cameraPosition;
  return Math.hypot(b.x - c.x, b.y - c.y, b.z - c.z);
}

const nearParent = (moon: MoonDefinition) => distanceFromCamera(moon.parent) < moon.nearParentAu;

/** Orbit lines for the moons (one orbit each), drawn around their parents every frame */
export function createMoonOrbits(store: EngineStore) {
  const orbits = [...SATURN_MOONS, ...URANUS_MOONS].map((moon) => ({
    moon,
    lineList: createOrbitLineList(densifiedRows(moon.table.j2000(moon.parent), LINE_TOLERANCE_AU), moon.color),
  }));
  const drawOrbits = () => {
    const shown = orbits.filter(({ moon }) => nearParent(moon));
    if (shown.length === 0) {
      return;
    }
    const rotation = precessionMatrix(tdbNow());
    shown.forEach(({ moon, lineList }) => drawOrbitLineInFrame(lineList, moon.parent, rotation));
  };
  store.addFrameCallback(drawOrbits);
  return () => store.removeFrameCallback(drawOrbits);
}

/** Markers for Saturn's major moons that keep going around (each table wraps by the moon's period) */
export function createMoonLayers(store: EngineStore): Promise<SpreadSheetLayer[]> {
  return Promise.all(
    [...SATURN_MOONS, ...URANUS_MOONS].map((moon) => {
      const positionAt = moonPositionAt(moon.table, moon.periodDays, moon.parent);
      // null hides the marker
      return createMovingMarkerLayer(store, moon.name, moon.parent, moon.color, (t) =>
        nearParent(moon) ? positionAt(t) : null,
      );
    }),
  );
}
