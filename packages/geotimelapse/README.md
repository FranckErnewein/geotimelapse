# geotimelapse

Replay a day of geolocated events on a dark glowing map: deck.gl point lights
with fading trails over a Mapbox basemap, a waveform seek bar, running totals,
and a TV mode (autoplay, loop, self-hiding UI and cursor).

## Usage

```tsx
import 'mapbox-gl/dist/mapbox-gl.css';

import { GeoTimelapse } from 'geotimelapse';
import { createDuckDbSource } from 'geotimelapse/duckdb';

const source = createDuckDbSource({
  parquetUrl: '/data/replay-2026-09-05.parquet',
  bundles: myDuckDbBundles, // e.g. self-hosted, or duckdb.getJsDelivrBundles()
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

The component fills its parent: give the wrapper an explicit size.

### Data contract

`GeoTimelapseSource` is the only coupling to your data: implement `load`,
`frame`, `totals`, `activity` and `setScope` over any backend (see
`src/types.ts`). `geotimelapse/duckdb` ships a ready-made source that loads a
day parquet (`day_second` INT sorted, a value column, `lat`/`lon` FLOAT) into
an in-browser duckdb-wasm table.

### Peer dependencies

`react`, `react-dom`, `deck.gl`, `mapbox-gl`, `react-map-gl` — plus
`@duckdb/duckdb-wasm` (optional) if you use `geotimelapse/duckdb`.

### Styling

Components are styled with Tailwind CSS v4 classes. Add the package to your
Tailwind sources so they get generated:

```css
@import 'tailwindcss';
@source '../node_modules/geotimelapse/dist';
```
