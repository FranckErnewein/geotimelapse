import { useState, useEffect, useMemo } from 'react'
import { WorkerAnwser } from '../types'
import csvWorker from '../csvWorker?worker&url'

export default function useCSV(url: string, bounds: number[]) {
  const worker = useMemo<Worker>(() => {
    console.log('init worker')
    const w = new Worker(new URL(csvWorker, import.meta.url), {
      type: 'module',
    })
    w.onmessage = (event: MessageEvent<WorkerAnwser>) => {
      setData((prevData) => ({ ...prevData, ...event.data }))
      setLoading(false)
    }
    return w
  }, [])
  const [data, setData] = useState<WorkerAnwser>({})
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    setLoading(true)
    worker.postMessage(url)
  }, [url, worker])

  useEffect(() => {
    worker.postMessage(bounds)
  }, [bounds, worker])

  return { data, loading }
}
