import { useState, useEffect } from 'react'
import { Config, Coordinates } from '../types'
import { getDB } from '../db'

export default function useDataset(config: Config) {
  const [items, setItems] = useState<Coordinates[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      const db = await getDB()
      const conn = await db.connect()
      try {
        const url = new URL(config.csv, document.location.origin).href
        const { longitude, latitude, date } = config.fields
        const filters = Object.entries(config.filters ?? {})
          .map(([column, value]) => `AND "${column}" = '${value}'`)
          .join(' ')

        const days = config.default_range.days ?? 7
        const from = new Date(config.date_start)
        const to = new Date(from.getTime() + days * 24 * 60 * 60 * 1000)
        const toISODate = (d: Date) => d.toISOString().slice(0, 10)

        const result = await conn.query(`
          SELECT
            TRY_CAST("${longitude}" AS DOUBLE) AS longitude,
            TRY_CAST("${latitude}" AS DOUBLE) AS latitude
          FROM read_csv('${url}', header = true)
          WHERE longitude IS NOT NULL
            AND latitude IS NOT NULL
            AND "${date}" >= DATE '${toISODate(from)}'
            AND "${date}" < DATE '${toISODate(to)}'
            ${filters}
        `)

        if (cancelled) return
        setItems(
          result
            .toArray()
            .map((row) => [row.longitude, row.latitude] as Coordinates)
        )
      } finally {
        await conn.close()
      }
    }

    load()
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [config])

  return { items, loading, error }
}
