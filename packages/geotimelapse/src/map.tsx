'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DeckGLRef } from 'deck.gl';
import DeckGL, { WebMercatorViewport } from 'deck.gl';
import type { MapRef } from 'react-map-gl/mapbox';
import Map from 'react-map-gl/mapbox';

import type { GlowTuning } from './glow-layer.js';
import { buildGlowLayers, DEFAULT_GLOW_TUNING } from './glow-layer.js';
import type { FrameBids } from './hooks.js';
import { mapStyle } from './map-style.js';
import type { MapBounds } from './types.js';


interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

const CONTINENTAL_US_VIEW: ViewState = {
  longitude: -98.5,
  latitude: 38.8,
  zoom: 4,
  pitch: 0,
  bearing: 0,
};

export default function TimelapseMap({
  frames,
  mapboxAccessToken,
  initialBounds,
  tuning,
  onBoundsChange,
}: {
  frames: FrameBids[];
  mapboxAccessToken: string;
  initialBounds?: MapBounds;
  tuning?: Partial<GlowTuning>;
  onBoundsChange: (bounds: MapBounds) => void;
}) {
  const deckRef = useRef<DeckGLRef>(null);
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Fitting bounds needs the container size, unknown before the first layout;
  // the map mounts one frame later, invisible on the black stage.
  const [initialViewState, setInitialViewState] = useState<ViewState | null>(initialBounds ? null : CONTINENTAL_US_VIEW);

  useLayoutEffect(() => {
    if (!initialBounds || initialViewState) return;
    const container = containerRef.current;
    if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;
    const { longitude, latitude, zoom } = new WebMercatorViewport({
      width: container.clientWidth,
      height: container.clientHeight,
    }).fitBounds([
      [initialBounds.west, initialBounds.south],
      [initialBounds.east, initialBounds.north],
    ]);
    setInitialViewState({ longitude, latitude, zoom, pitch: 0, bearing: 0 });
  }, [initialBounds, initialViewState]);

  // Mapbox misses the container resize on fullscreen toggles (deck redraws,
  // the basemap stays stale); poke it once the new dimensions have settled.
  useEffect(() => {
    const onFullscreenChange = () => {
      requestAnimationFrame(() => mapRef.current?.resize());
      setTimeout(() => mapRef.current?.resize(), 350);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Read from the deck viewport (not the event's view state) so the numbers
  // include the canvas dimensions; one frame of lag is fine for consumers.
  const reportBounds = () => {
    const viewport = deckRef.current?.deck?.getViewports()[0];
    if (!viewport) return;
    const [west, south, east, north] = viewport.getBounds();
    const round = (value: number) => Math.round(value * 1000) / 1000;
    onBoundsChange({ west: round(west), south: round(south), east: round(east), north: round(north) });
  };

  const layers = buildGlowLayers(frames, { ...DEFAULT_GLOW_TUNING, ...tuning });

  return (
    <div ref={containerRef} className="absolute inset-0">
      {initialViewState && (
        <DeckGL
          ref={deckRef}
          initialViewState={initialViewState}
          controller
          layers={layers}
          onLoad={reportBounds}
          onViewStateChange={reportBounds}
          onResize={reportBounds}
        >
          <Map ref={mapRef} mapboxAccessToken={mapboxAccessToken} mapStyle={mapStyle} />
        </DeckGL>
      )}
    </div>
  );
}
