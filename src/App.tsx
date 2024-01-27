import { useWindowSize } from '@uidotdev/usehooks'
import './index.css'
import { MapboxProvider } from './contexts/MapboxContext'
import { Mapbox } from './components/Mapbox'

function App() {
  const { width, height } = useWindowSize()
  return (
    <MapboxProvider>
      {width && height && (
        <Mapbox
          width={width}
          height={height}
          longitude={3.9916938214529996}
          latitude={43.55226599834255}
          zoom={8}
        />
      )}
    </MapboxProvider>
  )
}

export default App
