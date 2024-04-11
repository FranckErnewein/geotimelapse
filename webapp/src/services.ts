import axios from 'axios'

import { Config } from './types'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-type': 'application/json',
  },
})

export const getConfigs = () => api.get<Config[]>('configs').then((r) => r.data)
