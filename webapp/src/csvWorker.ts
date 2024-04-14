import { parse, Parser } from 'papaparse'
import { Item, CSVLine, WorkerAnwser, Config } from './types'
import { uniqBy, sortBy } from 'lodash'
import getActivity from './utils/getActivity'

let parser: null | Parser = null
let items: Item[] = []
let config: null | Config = null
let bounds: number[] = [-10, 41, 10, 50]

function filterBoundedData(data: Item[], bounds: number[]): Item[] {
  return data.filter((item: Item) => {
    return (
      item.longitude > bounds[0] &&
      item.longitude < bounds[2] &&
      item.latitude > bounds[1] &&
      item.latitude < bounds[3]
    )
  })
}

function getWidgetData(data: Item[], bounds: number[]): WorkerAnwser {
  return { activity: getActivity(filterBoundedData(data, bounds)) }
}

self.onmessage = async (e: MessageEvent<Config | string>) => {
  if (
    e.data &&
    typeof e.data === 'object' &&
    typeof e.data.id === 'string' &&
    (!config || config.id !== e.data.id)
  ) {
    config = e.data
    if (parser) parser.abort()
    items = []
    self.postMessage({
      map: { items },
      loading: undefined,
      activity: undefined,
    })
    const baseURL = import.meta.env.VITE_API_URL ?? '/api'
    const csvUrl = `${baseURL}/csv/${config.id}`
    parse<CSVLine>(csvUrl, {
      download: true,
      dynamicTyping: true,
      header: true,
      step: (r, p) => {
        parser = p
        if (!config) {
          parser.abort()
          return
        }
        const line = r.data
        const id = line[config.fields.id]
        const date = line[config.fields.date]
        const value = line[config.fields.value]
        const longitude = line[config.fields.longitude]
        const latitude = line[config.fields.latitude]
        for (const filter in config.filters) {
          if (line[filter] !== config.filters[filter]) return
        }
        if (
          typeof id === 'string' &&
          typeof date === 'string' &&
          typeof value === 'number' &&
          typeof longitude === 'number' &&
          typeof latitude === 'number'
        ) {
          items.push({
            id,
            longitude,
            latitude,
            date,
            value: Math.round(value),
          })
        }
        if (items.length % 1011 === 0) {
          self.postMessage({
            loading: items.length,
          })
        }
      },
      complete: () => {
        parser = null
        items = sortBy(uniqBy(items, 'id'), 'date')
        self.postMessage({
          map: { items },
          loading: undefined,
          ...getWidgetData(items, bounds),
        })
      },
    })
  }

  if (
    e.data instanceof Array &&
    typeof e.data[0] === 'number' &&
    typeof e.data[1] === 'number' &&
    typeof e.data[2] === 'number' &&
    typeof e.data[3] === 'number' &&
    JSON.stringify(e.data) !== JSON.stringify(bounds)
  ) {
    bounds = e.data
    if (!parser) {
      self.postMessage(getWidgetData(items, bounds))
    }
  }
}

export default {}
