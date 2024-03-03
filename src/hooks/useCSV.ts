import { useState, useEffect } from 'react'
import { parse } from 'papaparse'
import { uniqBy, sortBy } from 'lodash'

export interface Item {
  date: string
  longitude: number
  latitude: number
  [key: string]: string | number | boolean | null | undefined
}

export default function useCSV() {
  const [data, setData] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    setLoading(true)
    let unmount = false
    let items: Item[] = []
    parse<Item>('http://localhost:5173/full.csv', {
      download: true,
      dynamicTyping: true,
      header: true,
      chunk: (r, parser) => {
        if (unmount) {
          parser.abort()
          return
        }
        items = items.concat(
          r.data.filter(
            (item) => item.nature_mutation === 'Vente' //&&
            // item.latitude < 60 &&
            // item.latitude > 41 &&
            // item.longitude > -10 &&
            // item.longitude < 10
          )
        )
        // parser.abort()
      },
      complete: () => {
        if (unmount) return
        setData(sortBy(uniqBy(items, 'id_mutation'), 'date_mutation'))
        setLoading(false)
      },
    })
    return () => {
      unmount = true
    }
  }, [setData])

  return { data, loading }
}
