import { useState, useEffect } from 'react'
import { parse, Parser } from 'papaparse'
import { uniqBy, sortBy } from 'lodash'

export interface Item {
  date: string
  longitude: number
  latitude: number
  [key: string]: string | number | boolean | null | undefined
}

export default function useCSV(url: string) {
  const [data, setData] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    setLoading(true)
    let parser: Parser | null = null
    let items: Item[] = []
    parse<Item>(url, {
      download: true,
      dynamicTyping: true,
      header: true,
      chunk: (r, _parser) => {
        parser = _parser
        items = items.concat(
          r.data.filter((item) => item.nature_mutation === 'Vente')
        )
        // parser.abort()
      },
      complete: () => {
        setData(sortBy(uniqBy(items, 'id_mutation'), 'date_mutation'))
        setLoading(false)
      },
    })
    return () => {
      if (parser) parser.abort()
    }
  }, [url])

  return { data, loading }
}
