import { useState, useEffect } from 'react'
import { Config } from '../types'

export default function useConfig(id: string) {
  const [config, setConfig] = useState<Config>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    setLoading(true)
    const configUrl = `http://localhost:5000/api/config/${id}`
    fetch(configUrl)
      .then((r) => r.json())
      .catch(() => {
        setError(true)
      })
      .then((config: Config) => {
        setConfig(config)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  return { config, loading, error }
}
