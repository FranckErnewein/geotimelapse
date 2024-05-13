import axios from 'axios'

import { Config } from './types'

const baseURL =
  import.meta.env.VITE_API_URL ?? `${document.location.origin}/api`

export const api = axios.create({
  baseURL,
  headers: {
    'Content-type': 'application/json',
  },
})

export const getConfigs = () => api.get<Config[]>('configs').then((r) => r.data)
export const getConfig = (id: string) =>
  api.get<Config>(`config/${id}`).then((r) => r.data)
