import { parse, Parser } from 'papaparse'
import { Item, WorkerParams } from './types'
import { uniqBy, sortBy } from 'lodash'

let parser: null | Parser = null
let items: Item[] = []
let url: null | string = null
let bounds: number[] = [-180, 90, -90, 180]

function filterData(data: Item[], bounds: number[]): Item[] {
  return data.filter(
    (item: Item) =>
      item.longitude > bounds[0] &&
      item.longitude < bounds[2] &&
      item.latitude > bounds[1] &&
      item.latitude < bounds[3]
  )
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
        items = items.concat(r.data)
      },
      complete: () => {
        parser = null
        items = sortBy(uniqBy(items, 'id_mutation'), 'date_mutation')
        self.postMessage({ type: 'global', items })
        self.postMessage({ type: 'local', items: filterData(items, bounds) })
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
      self.postMessage({ type: 'local', items: filterData(items, bounds) })
    }
  }
}

export default {}
