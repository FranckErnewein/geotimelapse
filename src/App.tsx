import Map from 'react-map-gl'
import styled from 'styled-components'
import './index.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import generateMapStyle from './generateMapStyle'
import { useWindowSize } from '@uidotdev/usehooks'

import useCSV from './hooks/useCSV'
import DeckGL from '@deck.gl/react/typed'
import { WebMercatorViewport } from '@deck.gl/core/typed'
import { PointCloudLayer } from '@deck.gl/layers/typed'
import Activity from './components/Activity'

const mapStyle = generateMapStyle()

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiZnJhbmNrZXJuZXdlaW4iLCJhIjoiYXJLM0dISSJ9.mod0ppb2kjzuMy8j1pl0Bw'

const Loader = styled.div`
  position: absolute;
  opacity: 0.5;
  color: white;
  top: 50%;
  left: 50%;
`

const Container = styled.div`
  background: black;
  position: relative;
`

function App() {
  const { width, height } = useWindowSize()
  const { loading, data } = useCSV('http://localhost:5173/full.csv')
  if (!width || !height) return

  const { longitude, latitude, zoom } = new WebMercatorViewport({
    width,
    height,
  }).fitBounds([
    [-10, 50],
    [10, 41],
  ])

  const layers = [
    new PointCloudLayer({
      id: 'point-layer',
      data,
      pickable: false,
      radiusPixels: 0.5,
      getPosition: (d) => [d.longitude, d.latitude],
      // getNormal: () => [-1, 0, 0],
      getColor: () => {
        return [190, 210, 255, 50]
      },
    }),
  ]

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
        controller={true}
        layers={layers}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width, height }}
          mapStyle={mapStyle}
        />
      </DeckGL>
      <Activity width={width} data={data} />
      {loading && <Loader>loading...</Loader>}
    </Container>
  )
}

export default App
