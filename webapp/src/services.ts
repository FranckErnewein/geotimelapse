import axios from 'axios'
import urlJoin from 'url-join'

import { Config } from './types'

const baseURL =
  import.meta.env.VITE_API_URL || urlJoin(document.location.href, 'api')

export const api = axios.create({
  baseURL,
  headers: {
    'Content-type': 'application/json',
  },
})

export const getConfigs = () => api.get<Config[]>('configs').then((r) => r.data)
