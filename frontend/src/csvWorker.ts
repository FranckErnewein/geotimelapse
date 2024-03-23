import { parse, Parser } from 'papaparse'
import { Item, CSVLine, WorkerParams, WorkerAnwser, Config } from './types'
import { sum, mapValues, groupBy, uniqBy, sortBy } from 'lodash'
import dayRange from './utils/dayRange'

let parser: null | Parser = null
let items: Item[] = []
let id: null | string = null
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
  const localItems = filterBoundedData(data, bounds)
  const activityValues = mapValues(groupBy(localItems, 'date'), (items) => {
    return {
      count: items.length,
      value: sum(items.map((item) => item.value)),
    }
  })
  const startDate = data[0]?.date?.toString() || '2023-01-01'
  const endDate = data[data.length - 2]?.date?.toString() || '2023-01-03'

  dayRange(startDate, endDate).forEach((date) => {
    if (!activityValues[date])
      activityValues[date] = {
        count: 0,
        value: 0,
      }
  })

  return {
    activity: {
      startDate,
      endDate,
      activity: Object.keys(activityValues)
        .sort()
        .map((date) => ({
          date,
          ...activityValues[date],
        })),
    },
  }
}

self.onmessage = async (e: MessageEvent<WorkerParams>) => {
  if (typeof e.data === 'string' && e.data !== id) {
    id = e.data
    items = []
    if (parser) parser.abort()
    const configUrl = `http://localhost:5000/api/config/${id}`
    const config: Config = await fetch(configUrl).then((r) => r.json())
    const csvUrl = `http://localhost:5000/api/csv/${id}`
    parse<CSVLine>(csvUrl, {
      download: true,
      dynamicTyping: true,
      header: true,
      step: (r, p) => {
        parser = p
        const line = r.data
        const id = line[config.fields.id]
        const date = line[config.fields.date]
        const value = line[config.fields.value]
        const longitude = line[config.fields.longitude]
        const latitude = line[config.fields.latitude]
        if (
          line.nature_mutation === 'Vente' && //TODO make it dynamic
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
        // p.abort()
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
