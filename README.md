# geotimelapse

Replay a day of geolocated events on a dark glowing map.

Live: https://franckernewein.github.io/geotimelapse/

- `packages/geotimelapse` — the React component (`<GeoTimelapse />`), data-source
  agnostic, plus a duckdb-wasm source adapter (`geotimelapse/duckdb`).
- `apps/website` — the website (presentation, glow lab, full-year demo),
  deployed to GitHub Pages on every push to `main`.

## Dev

```sh
pnpm install
pnpm build
pnpm test
```
