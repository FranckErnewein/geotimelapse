import * as duckdb from '@duckdb/duckdb-wasm';

import type { FramePoints, GeoTimelapseSource, MapBounds, Totals } from './types.js';

export interface DuckDbSourceOptions {
  /** URL of the day's parquet: day_second INT (seconds since the day's
   *  midnight, sorted), a value column, lat/lon FLOAT. ~60M rows is fine. */
  parquetUrl: string;
  /**
   * Where the duckdb-wasm engine files come from. Omitted: version-matched
   * jsDelivr URLs (zero config, external CDN). A string: the base URL you
   * serve `@duckdb/duckdb-wasm/dist` under — serve the copy THIS package
   * resolves, so the wasm matches the JS. An object: full bundle control.
   */
  engine?: string | duckdb.DuckDBBundles;
  /** Name of the parquet column summed into totals().value. */
  valueColumn?: string;
}

function resolveBundles(engine: DuckDbSourceOptions['engine']): duckdb.DuckDBBundles {
  if (!engine) return duckdb.getJsDelivrBundles();
  if (typeof engine === 'string') {
    const base = engine.replace(/\/$/, '');
    return {
      mvp: {
        mainModule: `${base}/duckdb-mvp.wasm`,
        mainWorker: `${base}/duckdb-browser-mvp.worker.js`,
      },
      eh: {
        mainModule: `${base}/duckdb-eh.wasm`,
        mainWorker: `${base}/duckdb-browser-eh.worker.js`,
      },
    };
  }
  return engine;
}

/**
 * A GeoTimelapseSource backed by duckdb-wasm: the parquet is downloaded once
 * and loaded into an in-browser table, then every read is a local query.
 * Each source owns its own engine instance (worker), so two components never
 * share state — at the price of one table copy per instance.
 */
export function createDuckDbSource({ parquetUrl, engine, valueColumn = 'value' }: DuckDbSourceOptions): GeoTimelapseSource {
  let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;
  let connPromise: Promise<duckdb.AsyncDuckDBConnection> | null = null;
  let loadPromise: Promise<void> | null = null;
  // Mutable slot so a load() call after the first (e.g. a React StrictMode
  // remount) still gets progress reports from the single in-flight download.
  let progressListener: ((loadedBytes: number, totalBytes: number) => void) | undefined;
  let scopeFilter = 'TRUE';
  let requestedFilter = 'TRUE';
  let scopeChain: Promise<void> = Promise.resolve();

  const getDB = () =>
    (dbPromise ??= (async () => {
      const bundle = await duckdb.selectBundle(resolveBundles(engine));
      const workerUrl = bundle.mainWorker!;
      // A same-origin worker loads directly (and its requests carry the
      // page's cookies); cross-origin URLs (the jsDelivr default) need
      // createWorker's same-origin blob wrapper or the browser blocks them.
      const sameOrigin = new URL(workerUrl, globalThis.location.href).origin === globalThis.location.origin;
      const worker = sameOrigin ? new Worker(workerUrl) : await duckdb.createWorker(workerUrl);
      const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), worker);
      await db.instantiate(bundle.mainModule);
      return db;
    })());

  const getConn = () => (connPromise ??= getDB().then((db) => db.connect()));

  // Running totals per second, so counters read one row per tick.
  const CREATE_TOTALS = `
    CREATE OR REPLACE TABLE totals_by_second AS
    SELECT day_second,
           sum(events) OVER w AS events,
           sum(value) OVER w AS value
    FROM scope_seconds
    WINDOW w AS (ORDER BY day_second)
  `;

  const load = (onProgress?: (loadedBytes: number, totalBytes: number) => void) => {
    if (onProgress) progressListener = onProgress;
    return (loadPromise ??= (async () => {
      const response = await fetch(parquetUrl);
      if (!response.ok || !response.body) throw new Error(`parquet download failed (${response.status})`);
      const totalBytes = Number(response.headers.get('content-length') ?? 0);
      const chunks: Uint8Array[] = [];
      let loadedBytes = 0;
      let lastReported = 0;
      const reader = response.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loadedBytes += value.byteLength;
        if (loadedBytes - lastReported >= 8 * 1024 * 1024) {
          lastReported = loadedBytes;
          progressListener?.(loadedBytes, totalBytes);
        }
      }
      const buffer = new Uint8Array(loadedBytes);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.byteLength;
      }
      progressListener?.(loadedBytes, totalBytes);

      const db = await getDB();
      await db.registerFileBuffer('replay.parquet', buffer);
      const conn = await getConn();
      // The value column is normalized at ingest so every later query is
      // schema-agnostic. The source order (sorted by day_second) is what
      // gives the in-memory table its zonemap pruning.
      await conn.query(`
        CREATE OR REPLACE TABLE events AS
        SELECT day_second, ${valueColumn} AS value, lat, lon
        FROM read_parquet('replay.parquet')
      `);
      // Per-second counts within the current scope, the single base both
      // aggregates derive from — so consumers never rescan the raw rows.
      await conn.query(`
        CREATE OR REPLACE TABLE scope_seconds AS
        SELECT day_second, count(*) AS events, sum(value) AS value
        FROM events
        GROUP BY day_second
      `);
      await conn.query(CREATE_TOTALS);
      await db.dropFile('replay.parquet');
    })());
  };

  const frame = async (fromSecond: number, toSecond: number): Promise<FramePoints> => {
    const conn = await getConn();
    // Integer bounds keep the comparison on the INTEGER column: a double
    // literal would disable zonemap pruning and full-scan the table.
    const result = await conn.query(`
      SELECT lon, lat, count(*)::DOUBLE AS weight FROM events
      WHERE day_second >= ${Math.floor(fromSecond)} AND day_second < ${Math.floor(toSecond)}
        AND lat IS NOT NULL AND lon IS NOT NULL
      GROUP BY lon, lat
    `);
    const lon = result.getChild('lon')!.toArray() as Float32Array;
    const lat = result.getChild('lat')!.toArray() as Float32Array;
    const weight = result.getChild('weight')!.toArray() as Float64Array;
    const positions = new Float32Array(lon.length * 2);
    const weights = new Float32Array(lon.length);
    for (let i = 0; i < lon.length; i++) {
      positions[2 * i] = lon[i];
      positions[2 * i + 1] = lat[i];
      weights[i] = weight[i];
    }
    return { positions, weights, count: lon.length };
  };

  const totals = async (second: number): Promise<Totals> => {
    const conn = await getConn();
    const result = await conn.query(`
      SELECT events::DOUBLE AS events, value::DOUBLE AS value
      FROM totals_by_second
      WHERE day_second < ${Math.floor(second)}
      ORDER BY day_second DESC
      LIMIT 1
    `);
    const row = result.numRows > 0 ? result.get(0) : null;
    return { count: Number(row?.events ?? 0), value: Number(row?.value ?? 0) };
  };

  const activity = async (): Promise<Float32Array> => {
    const conn = await getConn();
    const result = await conn.query(`
      SELECT (day_second // 60)::INT AS minute, sum(events)::DOUBLE AS events
      FROM scope_seconds
      GROUP BY minute
    `);
    const minutes = result.getChild('minute')!.toArray() as Int32Array;
    const events = result.getChild('events')!.toArray() as Float64Array;
    const counts = new Float32Array(24 * 60);
    for (let i = 0; i < minutes.length; i++) counts[minutes[i]] = events[i];
    return counts;
  };

  // The scan over the raw rows is chunked hour by hour (pruned on
  // day_second) so playback tick queries interleave instead of queueing
  // behind one long statement.
  const setScope = (bounds: MapBounds | null): Promise<void> => {
    const filter = bounds
      ? `lat BETWEEN ${bounds.south} AND ${bounds.north} AND lon BETWEEN ${bounds.west} AND ${bounds.east}`
      : 'TRUE';
    requestedFilter = filter;
    scopeChain = scopeChain
      .then(async () => {
        // Superseded while queued, or already active.
        if (requestedFilter !== filter || filter === scopeFilter) return;
        // The rebuild reads the events table: wait for the day to be loaded.
        await load();
        const conn = await getConn();
        await conn.query(`
          CREATE OR REPLACE TABLE scope_seconds_build AS
          SELECT day_second, count(*) AS events, sum(value) AS value
          FROM events WHERE false GROUP BY day_second
        `);
        for (let hour = 0; hour < 24; hour++) {
          if (requestedFilter !== filter) return;
          await conn.query(`
            INSERT INTO scope_seconds_build
            SELECT day_second, count(*), sum(value)
            FROM events
            WHERE day_second >= ${hour * 3600} AND day_second < ${(hour + 1) * 3600} AND ${filter}
            GROUP BY day_second
          `);
        }
        await conn.query(`CREATE OR REPLACE TABLE scope_seconds AS FROM scope_seconds_build`);
        await conn.query(`DROP TABLE scope_seconds_build`);
        await conn.query(CREATE_TOTALS);
        scopeFilter = filter;
      })
      // A failed rebuild keeps the previous scope; never poison the chain.
      .catch((error: unknown) => console.error('geotimelapse scope rebuild failed', error));
    return scopeChain;
  };

  const dispose = async () => {
    const conn = connPromise ? await connPromise.catch(() => null) : null;
    connPromise = null;
    await conn?.close().catch(() => {});
    const db = dbPromise ? await dbPromise.catch(() => null) : null;
    dbPromise = null;
    loadPromise = null;
    await db?.terminate().catch(() => {});
  };

  return { load, frame, totals, activity, setScope, dispose };
}
