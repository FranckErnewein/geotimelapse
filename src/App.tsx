import Map from 'react-map-gl'
import './index.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import generateMapStyle from './generateMapStyle'
import { useWindowSize } from '@uidotdev/usehooks'

import useCSV from './hooks/useCSV'
import DeckGL from '@deck.gl/react/typed'
import { WebMercatorViewport } from '@deck.gl/core/typed'
import { PointCloudLayer } from '@deck.gl/layers/typed'

// import Mapbox from './components/Mapbox'
// import Activity from './components/Activity'
// import Dots from './components/Dots'
// import Loader from './components/Loader'

const mapStyle = generateMapStyle()

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiZnJhbmNrZXJuZXdlaW4iLCJhIjoiYXJLM0dISSJ9.mod0ppb2kjzuMy8j1pl0Bw'

// const data = [
// {
// position: [-122.41669, 37.7853, 0],
// normal: [-1, 0, 0],
// color: [255, 0, 0],
// },
// ]

function App() {
  const { width, height } = useWindowSize()
  const { loading, data } = useCSV()
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
      radiusPixels: 1,
      getPosition: (d) => [d.longitude, d.latitude],
      getNormal: () => [-1, 0, 0],
      getColor: () => [255, 255, 255],
    }),
  ]

  return (
    <>
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
    </>
  )
}

export default App
