import { useWindowSize } from '@uidotdev/usehooks'
import { useParams } from 'react-router-dom'

import useConfig from '../hooks/useConfig'
import GeoTimelapse from './GeoTimelapse'

export default function Dataset() {
  const { id } = useParams()
  const { width, height } = useWindowSize()
  const { config } = useConfig(id)

  if (!config || !width || !height) return null
  return <GeoTimelapse {...{ ...config, width, height }} />
}
