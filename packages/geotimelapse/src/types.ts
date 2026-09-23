import type { GlowTuning } from './glow-layer.js';

/** Visible map area in degrees, WGS84. */
export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

/** Events of one frame window, aggregated by location. */
export interface FramePoints {
  /** Interleaved [lon, lat] pairs, one per distinct location. */
  positions: Float32Array;
  /** Events at each location; the rendered point AREA is linear in it. */
  weights: Float32Array;
  /** Number of locations (positions holds 2x this many floats). */
  count: number;
}

/** Cumulative totals since the start of the day. */
export interface Totals {
  count: number;
  value: number;
}

/**
 * A day of geolocated events, queryable by the component. Times are seconds
 * since the day's midnight, in [0, 86400). Every read reflects the scope set
 * by the latest setScope() call (null scope = everything).
 */
export interface GeoTimelapseSource {
  /** Prepares the day (downloads, tables...). Called once on mount. */
  load(onProgress?: (loadedBytes: number, totalBytes: number) => void): Promise<void>;
  /** Events won during [fromSecond, toSecond), aggregated by location. */
  frame(fromSecond: number, toSecond: number): Promise<FramePoints>;
  /** Cumulative totals from midnight up to (excluding) `second`. */
  totals(second: number): Promise<Totals>;
  /** Event count for each of the day's 1440 minutes. */
  activity(): Promise<Float32Array>;
  /** Scopes subsequent totals() and activity() reads to the given viewport. */
  setScope(bounds: MapBounds | null): Promise<void>;
  /**
   * Releases everything the source holds (workers, in-memory tables...). The
   * source is unusable afterwards. The component never calls it: the owner
   * who created the source disposes it when done.
   */
  dispose(): Promise<void>;
}

export interface GeoTimelapseProps {
  source: GeoTimelapseSource;
  mapboxAccessToken: string;
  /** Area the map initially fits; defaults to the continental US. */
  initialBounds?: MapBounds;
  /** Overrides on the glow rendering knobs (see GlowTuning). Calibrate
   *  pointAlpha to the day's density: the playback trail stacks 12 additive
   *  frames, so dense datasets need it well below the bench value. */
  tuning?: Partial<GlowTuning>;
  /** Shown before the clock time, e.g. "Sat, Sep 5, 2026". */
  dateLabel?: string;
  /** Shown after the clock time, e.g. "EDT". */
  timeZoneLabel?: string;
  formatValue?: (value: number) => string;
  formatCount?: (count: number) => string;
}
