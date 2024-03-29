import { useState, useEffect } from 'react'
import { Config } from '../types'

export default function useConfig(id?: string) {
  const [config, setConfig] = useState<Config>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    const configUrl = `${import.meta.env.VITE_API_URL}/api/config/${id}`
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
