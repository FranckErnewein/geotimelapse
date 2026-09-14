'use client';

import { createContext, useContext } from 'react';

import type { MapBounds } from './types.js';

const BoundsContext = createContext<MapBounds | null>(null);

export const MapBoundsProvider = BoundsContext.Provider;

/** The map's current viewport bounds; null until the map has loaded. */
export function useMapBounds(): MapBounds | null {
  return useContext(BoundsContext);
}
