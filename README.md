# Geotimelapse

Frontend-only app: CSVs are loaded and queried in the browser with
[DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview), no backend.

## Dev

```
cd webapp
npm install
npm run dev
```

Datasets are declared in `webapp/src/configs.json`. CSVs hosted on the
`geotimelapse` S3 bucket are fetched through the Vite dev proxy (`/s3/...`,
see `vite.config.ts`) because the bucket does not send CORS headers. For a
production deployment, either enable CORS on the bucket or configure an
equivalent rewrite on the host.
