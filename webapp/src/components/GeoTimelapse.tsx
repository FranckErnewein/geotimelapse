import { FC } from 'react'
import Map from 'react-map-gl'
import DeckGL from '@deck.gl/react'
import { WebMercatorViewport } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'
import GlowingLayer from '../layers/GlowingLayer'

import { Config, Coordinates } from '../types'
import generateMapStyle from '../utils/generateMapStyle'
import useDataset from '../hooks/useDataset'

const mapStyle = generateMapStyle()

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiZnJhbmNrZXJuZXdlaW4iLCJhIjoiYXJLM0dISSJ9.mod0ppb2kjzuMy8j1pl0Bw'

export type GeoTimelapseProps = {
  config: Config
  width: number
  height: number
}

const GeoTimelapse: FC<GeoTimelapseProps> = ({ config, width, height }) => {
  const {
    bounds: { east, north, west, south },
  } = config
  const {
    longitude,
    latitude,
    zoom: initialZoom,
  } = new WebMercatorViewport({
    width,
    height,
  }).fitBounds([
    [east, north],
    [west, south],
  ])

  const { items, loading, error } = useDataset(config)

  const layers = [
    new GlowingLayer<Coordinates>({
      id: 'glowing-layer',
      data: items,
      pickable: true,
      radiusUnits: 'pixels',
      getRadius: 10,
      getPosition: (d) => d,
      getFillColor: [200, 255, 255],
    }),
    new ScatterplotLayer<Coordinates>({
      id: 'scatterplot-layer',
      data: items,
      pickable: true,
      radiusUnits: 'pixels',
      getRadius: 0.5,
      getPosition: (d) => d,
      getFillColor: [255, 255, 255],
    }),
  ]

  return (
    <div className="monospace bg-black relative" style={{ width, height }}>
      <DeckGL
        width={width}
        height={height}
        initialViewState={{
          longitude,
          latitude,
          zoom: initialZoom,
          pitch: 0,
          bearing: 0,
        }}
        controller={true}
        layers={layers}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width, height }}
          mapStyle={mapStyle}
        />
      </DeckGL>
      {loading && (
        <div style={{ position: 'absolute', top: 10, left: 10, color: '#fff' }}>
          loading…
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', top: 10, left: 10, color: '#f66' }}>
          {error.message}
        </div>
      )}
    </div>
  )
}

export default GeoTimelapse
