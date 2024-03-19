export interface Item {
  id: string
  date: string
  longitude: number
  latitude: number
  value: number
}

export interface CSVLine {
  [key: string]: number | string
}

export type WorkerParams = string | number[]

export interface MapProps {
  items: Item[]
}

export interface ActivityDateItem {
  date: string
  count: number
  value: number
}

export interface ActivityProps {
  startDate: string
  endDate: string
  activity: ActivityDateItem[]
}

export interface WorkerAnwser {
  map?: MapProps
  activity?: ActivityProps
  loading?: number
}
