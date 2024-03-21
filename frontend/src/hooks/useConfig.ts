import { useState, useEffect, useMemo } from 'react'
import { WorkerAnwser } from '../types'
import csvWorker from '../csvWorker?worker&url'

export default function useConfig(id: string, bounds: number[]) {
  const worker = useMemo<Worker>(() => {
    const w = new Worker(new URL(csvWorker, import.meta.url), {
      type: 'module',
    })
    w.onmessage = (event: MessageEvent<WorkerAnwser>) => {
      setData((prevData) => ({ ...prevData, ...event.data }))
    }
    return w
  }, [])
  const [data, setData] = useState<WorkerAnwser>({})

  useEffect(() => {
    worker.postMessage(id)
  }, [id, worker])

  useEffect(() => {
    worker.postMessage(bounds)
  }, [bounds, worker])

  return { data }
}
