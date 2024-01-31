import { FC, useRef, useEffect, useContext } from 'react'
import * as mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useWindowSize } from '@uidotdev/usehooks'

import generateMapStyle from '../generateMapStyle'
import MapboxContext from '../contexts/MapboxContext'
import DataContext from '../contexts/DataContext'

// @ts-expect-error this is not readonly
mapboxgl.accessToken =
  'pk.eyJ1IjoiZnJhbmNrZXJuZXdlaW4iLCJhIjoiYXJLM0dISSJ9.mod0ppb2kjzuMy8j1pl0Bw'

interface MapboxProps {}

const Mapbox: FC<MapboxProps> = () => {
  const { width, height } = useWindowSize()
  const container = useRef(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const { registerMap } = useContext(MapboxContext)
  // const { stream } = useContext(DataContext)
  const { data } = useContext(DataContext)

  useEffect(() => {
    if (width === null || height === null || map.current || !container.current)
      return
    map.current = new mapboxgl.Map({
      container: container.current,
      center: [0, 0],
      zoom: 1,
      style: generateMapStyle(),
    })
    registerMap(map.current)
  }, [width, height, registerMap])

  useEffect(() => {
    if (!map.current) return
    const bbox = data.reduce(
      (memo, item) => {
        return {
          north: Math.min(memo.north, item.latitude),
          south: Math.max(memo.south, item.latitude),
          east: Math.max(memo.east, item.longitude),
          west: Math.min(memo.west, item.longitude),
        }
      },
      { north: 90, south: -90, east: -180, west: 180 }
    )
    console.log(bbox)
    map.current.fitBounds([
      new mapboxgl.LngLat(bbox.west, bbox.south),
      new mapboxgl.LngLat(bbox.east, bbox.north),
    ])
  }, [data])

  if (!width || !height) return null

  return <div style={{ height, width }} ref={container} />
}

export default Mapbox
