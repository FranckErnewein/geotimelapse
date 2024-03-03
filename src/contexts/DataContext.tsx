import { createContext, useState, useEffect, FC, ReactNode } from 'react'
import { parse } from 'papaparse'
import { uniqBy, sortBy } from 'lodash'

interface Props {
  children: ReactNode
}

export interface Item {
  date: string
  longitude: number
  latitude: number
  [key: string]: string | number | boolean | null | undefined
}

interface DataContextInterface {
  data: Item[]
  // stream?: Item
  loading: boolean
}

const defaultDataContext = { data: [], loading: false }

const DataContext = createContext<DataContextInterface>(defaultDataContext)

const { Provider } = DataContext

export const DataProvider: FC<Props> = ({ children }) => {
  const [data, setData] = useState<Item[]>(defaultDataContext.data)
  // const [stream, setStream] = useState<Item | undefined>()
  const [loading, setLoading] = useState<boolean>(defaultDataContext.loading)

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
            (item) =>
              item.nature_mutation === 'Vente' &&
              item.latitude < 60 &&
              item.latitude > 41 &&
              item.longitude > -10 &&
              item.longitude < 10
          )
        )
        // parser.abort()
      },
      complete: () => {
        if (unmount) return
        console.log(items)
        setData(sortBy(uniqBy(items, 'id_mutation'), 'date_mutation'))
      },
    })
    return () => {
      unmount = true
    }
  }, [setData])

  return <Provider value={{ loading, data }}>{children}</Provider>
}

export default DataContext
