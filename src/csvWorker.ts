import { parse, Parser } from 'papaparse'
import { Item, WorkerParams, WorkerAnwser } from './types'
import { sum, mapValues, groupBy, uniqBy, sortBy } from 'lodash'
import dayRange from './utils/dayRange'

let parser: null | Parser = null
let items: Item[] = []
let url: null | string = null
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
  const activityValues = mapValues(
    groupBy(localItems, 'date_mutation'),
    (x) => x.length
  )
  const startDate = data[0]?.date_mutation?.toString() || '2023-01-01'
  const endDate =
    data[data.length - 2]?.date_mutation?.toString() || '2023-01-03'

  dayRange(startDate, endDate).forEach((date) => {
    if (!activityValues[date]) activityValues[date] = 0
  })

  const amount = Math.round(
    sum(localItems.map((item) => item.valeur_fonciere || 0))
  )

  return {
    activity: {
      startDate,
      endDate,
      values: activityValues,
    },
    counter: {
      count: localItems.length,
      amount,
    },
  }
}

self.onmessage = (e: MessageEvent<WorkerParams>) => {
  if (typeof e.data === 'string' && e.data !== url) {
    url = e.data
    items = []
    if (parser) parser.abort()

    parse<Item>(url, {
      download: true,
      dynamicTyping: true,
      header: true,
      chunk: (r, p) => {
        parser = p
        items = items.concat(
          uniqBy(
            r.data.filter((item) => item.nature_mutation === 'Vente'),
            'id_mutation'
          )
        )
        // p.abort()
      },
      complete: () => {
        parser = null
        items = sortBy(uniqBy(items, 'id_mutation'), 'date_mutation')
        self.postMessage({
          map: { items },
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
