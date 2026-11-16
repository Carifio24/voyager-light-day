import type { SolarSystemObjects } from "@wwtelescope/engine-types";

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export interface ViewSpec {
  time: string;
  track: SolarSystemObjects | "voyager1" | "voyager2";
  lat: number;
  lng: number;
  zoom: number;
  rotation: number;
  angle: number;
  modelLogScale: number;
}
