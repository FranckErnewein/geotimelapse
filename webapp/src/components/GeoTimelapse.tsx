import { FC, useState, useEffect } from 'react'
import { debounce } from 'lodash'
import Map from 'react-map-gl'
import styled from 'styled-components'
import { format, addDays } from 'date-fns'
import DeckGL from '@deck.gl/react'
import { WebMercatorViewport } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'
// import { IconLayer } from '@deck.gl/layers'
import GlowingLayer from '../layers/GlowingLayer'

import { Item, Config } from '../types'
import { defaultDayDuration } from '../constants'
import useCSV from '../hooks/useCSV'
import formatNumber from '../utils/formatNumber'
import generateMapStyle from '../utils/generateMapStyle'
// import { generateSprites, generateSpritesMapping } from '../layers/sprites'
import Activity from './Activity'
import Counter from './Counter'

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
  // const [details, setDetails] = useState<Item>()
  const [bounds, setBounds] = useState([east, north, west, south])
  const { data } = useCSV(config, bounds)
  const [fromDate, setFromDate] = useState<string | undefined>()
  const [toDate, setToDate] = useState<string | undefined>()

  const items = data.map?.items || []

  useEffect(() => {
    if (items[0]) {
      const firstDate = items[0].date
      setFromDate(firstDate)
      setToDate(format(addDays(firstDate, defaultDayDuration), 'yyyy-MM-dd'))
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

  const layers = [
    new GlowingLayer<Item>({
      id: 'glowing-layer',
      data: truncatedData,
      pickable: true,
      radiusUnits: 'pixels',
      getRadius: 10,
      getPosition: (d) => [d.longitude, d.latitude],
      getFillColor: [200, 255, 255],
    }),
    new ScatterplotLayer<Item>({
      id: 'scatterplot-layer',
      data: truncatedData,
      pickable: true,
      radiusUnits: 'pixels',
      getRadius: 0.5,
      getPosition: (d) => [d.longitude, d.latitude],
      getFillColor: [255, 255, 255],
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
