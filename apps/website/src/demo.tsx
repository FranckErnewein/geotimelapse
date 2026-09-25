import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { GeoTimelapseSource, MapBounds } from 'geotimelapse';
import { GeoTimelapse } from 'geotimelapse';
import { createDuckDbSource } from 'geotimelapse/duckdb';

import './styles.css';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZnJhbmNrZXJuZXdlaW4iLCJhIjoiYXJLM0dISSJ9.mod0ppb2kjzuMy8j1pl0Bw';

const FRANCE: MapBounds = { west: -5.2, south: 41.3, east: 9.6, north: 51.1 };

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('fr-FR');

// A year of French property sales (DVF open data), one row per located lot:
// t = epoch seconds (sale dates spread inside their day at build time), the
// value carried by each sale's first lot so the running total stays honest.
function DemoPage() {
  const [source, setSource] = useState<GeoTimelapseSource | null>(null);

  useEffect(() => {
    const created = createDuckDbSource({
      parquetUrl: `${import.meta.env.BASE_URL}immo-fr-2023.parquet`,
      valueColumn: 'value',
      timeColumn: 't',
    });
    // The resource must be created here so this effect's cleanup disposes exactly what it made.
    // oxlint-disable-next-line react/set-state-in-effect
    setSource(created);
    return () => void created.dispose();
  }, []);

  if (!source) return null;

  return (
    <div className="h-screen">
      <GeoTimelapse
        source={source}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialBounds={FRANCE}
        dateLabel="France · DVF 2023"
        formatValue={(value) => euro.format(value)}
        formatCount={(count) => `${number.format(count)} lots`}
        tuning={{ pointAlpha: 115, flashRadius: 12_000, ghostMaxRadius: 8_000, ghostMinRadius: 1_000, minRadiusPx: 3 }}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<DemoPage />);
