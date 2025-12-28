import { useWindowSize } from '@uidotdev/usehooks'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { getConfig } from '../services'
import GeoTimelapse from './GeoTimelapse'

export default function Dataset() {
  const { id = 'undefined' } = useParams()
  const { width, height } = useWindowSize()
  const { data: config } = useQuery({
    queryKey: ['config', id],
    queryFn: () => getConfig(id),
  })

  if (!config || !width || !height) return null
  return <GeoTimelapse {...{ ...config, width, height }} />
}
