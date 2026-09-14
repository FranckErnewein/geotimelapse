export interface ConfigFields {
  id: string
  date: string
  latitude: string
  longitude: string
  value: string
}

export interface Bounds {
  north: number
  east: number
  west: number
  south: number
}

export interface Config {
  id: string
  csv: string
  fields: ConfigFields
  bounds: Bounds
  filters?: {
    [key: string]: string
  }
  date_start: string
  default_range: {
    days?: number
  }
  time_unit: {
    days?: number
  }
}

export interface Item {
  id: string
  date: string
  longitude: number
  latitude: number
  value: number
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

export type Coordinates = [longitude: number, latitude: number]
