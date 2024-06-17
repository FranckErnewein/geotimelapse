// import { Writable } from 'stream'
import axios from 'axios'
import { get } from 'lodash/fp'

import { Config } from './types'

const baseURL =
  import.meta.env.VITE_API_URL ?? `${document.location.origin}/api`

export const api = axios.create({
  baseURL,
  headers: {
    'Content-type': 'application/json',
  },
})

export const ping = () => api.get('ping').then(get('data'))
export const getConfigs = () => api.get<Config[]>('configs').then(get('data'))
export const getConfig = (id: string) =>
  api.get<Config>(`config/${id}`).then(get('data'))

// export const createCSVStream = (id: string) => {
// const stream = new Writable()
// api.request({
// method: 'POST',
// url: `/datasets/${id}`,
// data: stream,
// })
// return (chunk: string | null) => stream.write(chunk)
// }

export const sendCSV = (id: string, csv: string) => {
  return axios.post(`${baseURL}datasets/${id}`, csv)
}
