import { createContext, useState, useEffect, FC, ReactNode } from 'react'
import { parse, Parser } from 'papaparse'

interface Props {
  children: ReactNode
}

interface Item {
  date: string
  longitude: number
  latitude: number
  // [x: string | number | symbol]: string | number | boolean | null
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
  console.log('data provider render')

  useEffect(() => {
    setLoading(true)
    console.log('start loading')
    let unmount = false
    let items: Item[] = []
    parse<Item>('http://localhost:5173/full.csv', {
      download: true,
      header: true,
      chunk: (r, parser) => {
        if (unmount) {
          parser.abort()
          return
        }
        items = items.concat(r.data)
      },
      complete: () => {
        if (unmount) return
        setData(items)
      },
    })
    return () => {
      unmount = true
    }
  }, [setData])

  return <Provider value={{ loading, data }}>{children}</Provider>
}

export default DataContext
