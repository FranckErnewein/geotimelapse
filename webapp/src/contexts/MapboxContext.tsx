import { createContext, useState, FC, ReactNode } from 'react'
import * as mapboxgl from 'mapbox-gl'

interface BoundingBox {
  north: number
  south: number
  east: number
  west: number
}

interface MapboxContextInterface {
  zoom: number
  longitude: number
  latitude: number
  registerMap: (map: mapboxgl.Map) => void
  boundingBox: BoundingBox
  map: null | mapboxgl.Map
}

const defaultMapboxContext: MapboxContextInterface = {
  map: null,
  zoom: 1,
  longitude: 0,
  latitude: 0,
  registerMap: () => {
    return
  },
  boundingBox: {
    north: -90,
    south: 90,
    east: -180,
    west: 180,
  },
}

const MapboxContext =
  createContext<MapboxContextInterface>(defaultMapboxContext)

const { Provider } = MapboxContext

export const MapboxProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [longitude, setLongitude] = useState(defaultMapboxContext.longitude)
  const [latitude, setLatitude] = useState(defaultMapboxContext.latitude)
  const [zoom, setZoom] = useState(defaultMapboxContext.zoom)
  const [map, setMap] = useState<null | mapboxgl.Map>(null)
  const [boundingBox, setBoundingBox] = useState<BoundingBox>(
    defaultMapboxContext.boundingBox
  )

  const registerMap = (map: mapboxgl.Map) => {
    setMap(map)
    map.on('move', () => {
      const center = map.getCenter()
      setLongitude(center.lng)
      setLatitude(center.lat)
      setZoom(map.getZoom())
      const bounds = map.getBounds()

      setBoundingBox({
        north: bounds.getNorth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        south: bounds.getSouth(),
      })
    })
  }

  return (
    <Provider
      value={{ map, boundingBox, longitude, latitude, zoom, registerMap }}
    >
      {children}
    </Provider>
  )
}

export default MapboxContext
