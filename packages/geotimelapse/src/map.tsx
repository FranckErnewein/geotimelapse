'use client';

import { useEffect, useRef } from 'react';
import type { DeckGLRef } from 'deck.gl';
import DeckGL from 'deck.gl';
import type { MapRef } from 'react-map-gl/mapbox';
import Map from 'react-map-gl/mapbox';

import GlowLayer, { GLOW_PARAMETERS } from './glow-layer.js';
import type { FrameBids } from './hooks.js';
import { FRAME_HISTORY } from './hooks.js';
import { mapStyle } from './map-style.js';
import type { MapBounds } from './types.js';


const CONTINENTAL_US_VIEW = {
  longitude: -98.5,
  latitude: 38.8,
  zoom: 4,
  pitch: 0,
  bearing: 0,
};

// Fresh events flash wide, then the trail tightens linearly down to a
// pinprick on the oldest ghost, however deep FRAME_HISTORY is.
const FLASH_RADIUS = 15;
const GHOST_MAX_RADIUS = 10;
const GHOST_MIN_RADIUS = 1;

function radiusForAge(age: number): number {
  if (age === 0) return FLASH_RADIUS;
  const taper = (age - 1) / Math.max(FRAME_HISTORY - 2, 1);
  return GHOST_MAX_RADIUS - (GHOST_MAX_RADIUS - GHOST_MIN_RADIUS) * taper;
}

export default function TimelapseMap({
  frames,
  mapboxAccessToken,
  onBoundsChange,
}: {
  frames: FrameBids[];
  mapboxAccessToken: string;
  onBoundsChange: (bounds: MapBounds) => void;
}) {
  const deckRef = useRef<DeckGLRef>(null);
  const mapRef = useRef<MapRef>(null);

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

  // One layer per remembered frame, fading with age into a ghost trail. The
  // layer id is the frame's ring-buffer slot: a slot's data only changes when
  // its frame rotates out, so per tick a single layer re-uploads attributes.
  const layers = frames.map(
    (frame, age) =>
      new GlowLayer({
        id: `frame-points-${frame.key % FRAME_HISTORY}`,
        data: {
          length: frame.count,
          attributes: {
            getPosition: { value: frame.positions, size: 2 },
            // sqrt(weight) per location: point AREA stays linear in the weight.
            getRadius: { value: frame.radii, size: 1 },
          },
        },
        // Bluish halo tint; the shader keeps the point core pure white.
        // The alpha is the master transparency: density does the brightening.
        getFillColor: [190, 222, 255, 115],
        // Fill-rate is the frame budget: cost grows with the quad area (r²),
        // so ghost frames shrink with age — the glow cools as it fades.
        radiusScale: radiusForAge(age),
        radiusUnits: 'pixels',
        stroked: false,
        opacity: (FRAME_HISTORY - age) / FRAME_HISTORY,
        parameters: GLOW_PARAMETERS,
      }),
  );

  return (
    <DeckGL
      ref={deckRef}
      initialViewState={CONTINENTAL_US_VIEW}
      controller
      layers={layers}
      onLoad={reportBounds}
      onViewStateChange={reportBounds}
      onResize={reportBounds}
    >
      <Map ref={mapRef} mapboxAccessToken={mapboxAccessToken} mapStyle={mapStyle} />
    </DeckGL>
  );
}
