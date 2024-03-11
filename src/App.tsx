import { useState, useMemo } from 'react'
import { debounce } from 'lodash'
import Map from 'react-map-gl'
import styled from 'styled-components'
import './index.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import generateMapStyle from './generateMapStyle'
import { useWindowSize } from '@uidotdev/usehooks'

import useCSV from './hooks/useCSV'
import DeckGL from '@deck.gl/react/typed'
import { WebMercatorViewport } from '@deck.gl/core/typed'
import { ScatterplotLayer } from '@deck.gl/layers/typed'
import Activity from './components/Activity'
import Counter from './components/Counter'

const mapStyle = generateMapStyle()

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiZnJhbmNrZXJuZXdlaW4iLCJhIjoiYXJLM0dISSJ9.mod0ppb2kjzuMy8j1pl0Bw'

const Container = styled.div`
  font-family: sans-serif;
  background: black;
  position: relative;
`

const Loader = styled.div`
  position: absolute;
  opacity: 0.5;
  color: white;
  top: 50%;
  left: 50%;
`

function App() {
  const { width, height } = useWindowSize()
  const [bounds, setBounds] = useState([-10, 50, 10, 41])
  const { loading, data, localData } = useCSV(
    'http://localhost:5173/full.csv',
    bounds
  )

  const layers = useMemo(
    () => [
      new ScatterplotLayer({
        id: 'scatterplot-layer',
        data,
        radiusUnit: 'meters',
        pickable: false,
        filled: true,
        stroked: false,
        opacity: 0.2,
        radiusScale: 6,
        lineWidthMinPixels: 0.5,
        radiusMinPixels: 0.3,
        radiusMaxPixels: 10,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: (d) => d.valeur_fonciere / 100000,
        getColor: () => [200, 200, 255],
      }),
    ],
    [data]
  )

  if (!width || !height) return

  const viewport = new WebMercatorViewport({
    width,
    height,
  }).fitBounds([
    [-10, 50],
    [10, 41],
  ])
  const { longitude, latitude, zoom } = viewport

  const onViewStateChange = debounce(
    ({ viewState }: { viewState: Record<string, unknown> }) => {
      const bounds = new WebMercatorViewport(viewState).getBounds()
      setBounds(bounds)
    },
    250
  )

  return (
    <Container style={{ width, height }}>
      <DeckGL
        width={width}
        height={height}
        initialViewState={{
          longitude,
          latitude,
          zoom,
          pitch: 0,
          bearing: 0,
        }}
        onViewStateChange={onViewStateChange}
        controller={true}
        layers={layers}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width, height }}
          longitude={longitude}
          latitude={latitude}
          zoom={zoom}
          mapStyle={mapStyle}
        />
      </DeckGL>
      <Activity width={width} data={localData} />
      <Counter data={localData} />
      {loading && <Loader>loading...</Loader>}
    </Container>
  )
}

export default App
