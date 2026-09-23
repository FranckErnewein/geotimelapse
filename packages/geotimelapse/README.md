# geotimelapse

Replay a day of geolocated events on a dark glowing map: deck.gl point lights
with fading trails over a Mapbox basemap, a waveform seek bar, running totals,
and a TV mode (autoplay, loop, self-hiding UI and cursor).

**[Live glow lab →](https://franckernewein.github.io/geotimelapse/)**

## Why it looks the way it does

- **Additive light, not markers** — every event is a tiny point light with a
  gaussian halo, blended additively: density builds the brightness, and
  hotspots bloom toward white the way long-exposure photos do.
- **Ground-anchored radii** — point radii are meters, not pixels, so the glow
  reads the same at every zoom level; heavy stacks approach a pixel ceiling
  asymptotically instead of clipping into flat discs.
- **Weight-scaled brightness** — co-located events are aggregated into one
  draw whose halo amplitude follows a film-exposure response on √count.
- **A trail that breathes** — each frame leaves ghosts that shrink and fade
  with age, and the trail length adapts to the achieved frame rate (sheds
  ghosts under 24 fps, grows them back above 58).
- **A full player** — per-minute activity waveform as the seek bar, running
  totals, hour axis, fullscreen TV mode.
- **Data-agnostic** — the component talks to a small `GeoTimelapseSource`
  contract; bring any backend, or use the bundled duckdb-wasm and synthetic
  sources.

## Install

```sh
npm install geotimelapse
```

Peer dependencies: `react`, `react-dom`, `deck.gl`, `mapbox-gl`,
`react-map-gl`. (`@duckdb/duckdb-wasm` is a regular dependency, pulled in only
when you import `geotimelapse/duckdb`.)

## Usage

```tsx
'use client'; // browser-only (WebGL, workers) — in Next.js, use it from a client component

import 'mapbox-gl/dist/mapbox-gl.css';

import { GeoTimelapse } from 'geotimelapse';
import { createDuckDbSource } from 'geotimelapse/duckdb';

const source = createDuckDbSource({
  parquetUrl: '/data/replay-2026-09-05.parquet',
  // engine omitted: version-matched jsDelivr CDN. Self-hosting: pass the base
  // URL you serve @duckdb/duckdb-wasm/dist under (the copy THIS package
  // resolves, so the wasm matches the JS), or full DuckDBBundles.
  valueColumn: 'spend_micros',
});

<div style={{ height: '100vh' }}>
  <GeoTimelapse
    source={source}
    mapboxAccessToken={token}
    dateLabel="Sat, Sep 5, 2026"
    timeZoneLabel="EDT"
    formatValue={(micros) => usd.format(micros / 1e6)}
    formatCount={(count) => `${count.toLocaleString()} wins`}
  />
</div>;
```

The component fills its parent: give the wrapper an explicit size. The source
holds a dedicated worker and the full in-memory table: call `source.dispose()`
when you are done with it (e.g. leaving the page in an SPA).

### Data contract

`GeoTimelapseSource` is the only coupling to your data: implement `load`,
`frame`, `totals`, `activity` and `setScope` over any backend (see
`src/types.ts`). Two sources ship with the package:

- `geotimelapse/duckdb` loads a day parquet (`day_second` INT sorted, a value
  column, `lat`/`lon` FLOAT) into an in-browser duckdb-wasm table.
- `geotimelapse/synthetic` generates a deterministic day in memory (gaussian
  clusters, uniform fog and single-spot stacks) — handy for demos and benches.

### Tuning

The glow is calibrated through the `tuning` prop, merged over the defaults:

```tsx
<GeoTimelapse source={source} tuning={{ pointAlpha: 50 }} ... />
```

`pointAlpha` is the master per-point transparency (0-255). The playback trail
stacks 12 additive frames, so dense datasets (thousands of points per frame)
need it well below the single-frame value. Other knobs: `flashRadius`,
`ghostMaxRadius`, `ghostMinRadius` (meters), `minRadiusPx`, `maxRadiusPx`,
`haloTint`, `trailFrames` — see `GlowTuning`.

### Styling

Components are styled with Tailwind CSS v4 classes. Add the package to your
Tailwind sources so they get generated:

```css
@import 'tailwindcss';
@source '../node_modules/geotimelapse/dist';
```

## License

MIT
