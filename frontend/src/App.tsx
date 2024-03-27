import { useWindowSize } from '@uidotdev/usehooks'

import useConfig from './hooks/useConfig'
import GeoTimelapse from './components/GeoTimelapse'

function App() {
  const { width, height } = useWindowSize()
  const { config } = useConfig('d320d734-9e67-415b-b12d-daa0dc696b90')

  if (!config || !width || !height) return null

  return <GeoTimelapse {...{ ...config, width, height }} />
}

export default App
