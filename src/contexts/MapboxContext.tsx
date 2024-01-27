import React, { createContext, useState, FC, ReactNode } from 'react'
import * as mapboxgl from 'mapbox-gl'

interface MapboxContextInterface {
  zoom: number
  longitude: number
  latitude: number
  registerMap: (map: mapboxgl.Map) => void
}

const defaultMapboxContext: MapboxContextInterface = {
  zoom: 1,
  longitude: 0,
  latitude: 0,
  registerMap: () => {
    return
  },
}

const MapboxContext =
  createContext<MapboxContextInterface>(defaultMapboxContext)

const { Provider } = MapboxContext

export const MapboxProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [longitude, setLongitude] = useState(defaultMapboxContext.longitude)
  const [latitude, setLatitude] = useState(defaultMapboxContext.latitude)
  const [zoom, setZoom] = useState(defaultMapboxContext.zoom)

  const registerMap = (map: mapboxgl.Map) => {
    map.on('move', () => {
      const center = map.getCenter()
      setLongitude(center.lng)
      setLatitude(center.lat)
      setZoom(map.getZoom())
    })
  }

  return (
    <Provider value={{ longitude, latitude, zoom, registerMap }}>
      {children}
    </Provider>
  )
}

export default MapboxContext
