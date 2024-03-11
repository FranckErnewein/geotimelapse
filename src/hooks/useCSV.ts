import { useState, useEffect, useMemo } from 'react'
import { Item, WorkerAnwser } from '../types'
import csvWorker from '../csvWorker?worker&url'

export default function useCSV(url: string, bounds: number[]) {
  const worker = useMemo<Worker>(() => {
    console.log('init worker')
    const w = new Worker(new URL(csvWorker, import.meta.url), {
      type: 'module',
    })
    w.onmessage = (event: MessageEvent<WorkerAnwser>) => {
      if (event.data.type === 'local') {
        setLocalData(event.data.items)
      }
      if (event.data.type === 'global') {
        setData(event.data.items)
      }
      setLoading(false)
    }
    return w
  }, [])
  const [data, setData] = useState<Item[]>([])
  const [localData, setLocalData] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  console.log('useCSV')

  useEffect(() => {
    setLoading(true)
    worker.postMessage(url)
  }, [url, worker])

  useEffect(() => {
    worker.postMessage(bounds)
  }, [bounds, worker])

  return { data, localData, loading }
}
