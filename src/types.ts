export interface Item {
  date_mutation: string
  longitude: number
  latitude: number
  [key: string]: string | number | boolean | null | undefined
}

export type WorkerParams = string | number[]

export interface MapProps {
  items: Item[]
}

export interface ActivityProps {
  startDate: string
  endDate: string
  values: {
    [time: string]: number
  }
}

export interface CounterProps {
  count: number
  amount: number
}

export interface WorkerAnwser {
  map?: MapProps
  activity?: ActivityProps
  counter?: CounterProps
}
