import { FC, useRef, useEffect, useContext } from 'react'
import MapboxContext from '../contexts/MapboxContext'
import generateMapStyle from '../generateMapStyle'
import 'mapbox-gl/dist/mapbox-gl.css'
import * as mapboxgl from 'mapbox-gl'

// @ts-expect-error this is not readonly
mapboxgl.accessToken =
  'pk.eyJ1IjoiZnJhbmNrZXJuZXdlaW4iLCJhIjoiYXJLM0dISSJ9.mod0ppb2kjzuMy8j1pl0Bw'

interface MapboxProps {
  width: number
  height: number
  zoom: number
  longitude: number
  latitude: number
}

export const Mapbox: FC<MapboxProps> = ({
  width,
  height,
  zoom,
  longitude,
  latitude,
}) => {
  const container = useRef(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const { registerMap } = useContext(MapboxContext)

  useEffect(() => {
    if (map.current || !container.current) return
    map.current = new mapboxgl.Map({
      container: container.current,
      center: [longitude, latitude],
      zoom,
      style: generateMapStyle(),
    })
    registerMap(map.current)
  })

  return <div style={{ height, width }} ref={container} />
}
