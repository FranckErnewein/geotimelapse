import { FC, useState, useEffect } from 'react'
import { debounce } from 'lodash'
import Map from 'react-map-gl'
import styled from 'styled-components'
import { format, addDays } from 'date-fns'
import DeckGL from '@deck.gl/react'
import { WebMercatorViewport } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'

import { Item, Config } from '../types'
import useCSV from '../hooks/useCSV'
import formatNumber from '../utils/formatNumber'
import generateMapStyle from '../utils/generateMapStyle'
import Activity from './Activity'
import Counter from './Counter'
import Details from './Details'

const mapStyle = generateMapStyle()

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiZnJhbmNrZXJuZXdlaW4iLCJhIjoiYXJLM0dISSJ9.mod0ppb2kjzuMy8j1pl0Bw'

const Container = styled.div`
  font-family: monospace;
  background: black;
  position: relative;
`

const Loader = styled.div`
  position: absolute;
  opacity: 0.5;
  color: white;
  top: 50%;
  left: 50%;
`

export type GeoTimelapseProps = Config & {
  width: number
  height: number
}

const GeoTimelapse: FC<GeoTimelapseProps> = ({ width, height, ...config }) => {
  const {
    bounds: { east, north, west, south },
  } = config
  const {
    longitude,
    latitude,
    zoom: initialZoom,
  } = new WebMercatorViewport({
    width,
    height,
  }).fitBounds([
    [east, north],
    [west, south],
  ])
  const [details, setDetails] = useState<Item>()
  const [bounds, setBounds] = useState([east, north, west, south])
  const { data } = useCSV(config, bounds)
  const [fromDate, setFromDate] = useState<string | undefined>()
  const [toDate, setToDate] = useState<string | undefined>()

  const items = data.map?.items || []

  useEffect(() => {
    if (items[0]) {
      const firstDate = items[0].date
      setFromDate(firstDate)
      setToDate(format(addDays(firstDate, 30), 'yyyy-MM-dd'))
    }
  }, [items])

  const fromIndex = fromDate
    ? items.findIndex((item) => item.date >= fromDate)
    : 0
  const toIndex = toDate
    ? items.findIndex((item) => item.date >= toDate)
    : items.length || 0
  const truncatedData = items.slice(fromIndex, toIndex) || []

  const fromActivityIndex =
    fromDate && data.activity
      ? data.activity.activity.findIndex((item) => item.date >= fromDate)
      : 0
  const toActivityIndex =
    toDate && data.activity
      ? data.activity?.activity.findIndex((item) => item.date >= toDate)
      : 0
  const truncatedActivity = data.activity
    ? data.activity.activity.slice(fromActivityIndex, toActivityIndex)
    : []
  const counterProps = truncatedActivity.reduce(
    (memo, act) => {
      return {
        count: memo.count + act.count,
        value: memo.value + act.value,
      }
    },
    { count: 0, value: 0 }
  )

  let radiusMinPixels = 0.3
  if (counterProps.count < 10000) radiusMinPixels = 0.4
  if (counterProps.count < 7000) radiusMinPixels = 0.5
  if (counterProps.count < 5000) radiusMinPixels = 0.7
  if (counterProps.count < 1000) radiusMinPixels = 1
  if (counterProps.count < 500) radiusMinPixels = 1.5

  const layers = [
    new ScatterplotLayer<Item>({
      id: 'scatterplot-layer',
      onHover: ({ object }) => setDetails(object),
      data: truncatedData,
      radiusUnits: 'meters',
      pickable: true,
      filled: true,
      stroked: false,
      radiusScale: 6,
      lineWidthMinPixels: 0.5,
      radiusMinPixels,
      radiusMaxPixels: 10,
      getPosition: (d) => [d.longitude, d.latitude],
      getRadius: (d, x) => {
        return (d.value / 1000000) * 10 * (x.index / truncatedData.length)
      },
      getFillColor: (_, x) => {
        return [200, 200, 255, 200 * (x.index / truncatedData.length) + 10]
      },
    }),
  ]

  const onViewStateChange = debounce(
    ({ viewState }: { viewState: Record<string, unknown> }) => {
      const viewport = new WebMercatorViewport(viewState)
      setBounds(viewport.getBounds())
    },
    250
  )

  return (
    <Container style={{ width, height }}>
      <DeckGL
        width={width}
        height={height}
        initialViewState={{
          longitude,
          latitude,
          zoom: initialZoom,
          pitch: 0,
          bearing: 0,
        }}
        onViewStateChange={onViewStateChange}
        controller={true}
        layers={layers}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width, height }}
          mapStyle={mapStyle}
        />
      </DeckGL>
      {details && <Details item={details} />}
      {data.activity && fromDate && toDate && (
        <Activity
          setToDate={setToDate}
          setFromDate={setFromDate}
          width={width}
          from={fromDate}
          to={toDate}
          {...data.activity}
        />
      )}
      {data.activity?.activity && <Counter {...counterProps} />}
      {data.loading && (
        <Loader>{formatNumber(data.loading)} lines loaded</Loader>
      )}
    </Container>
  )
}

export default GeoTimelapse
