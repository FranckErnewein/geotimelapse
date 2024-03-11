export interface Item {
  date: string
  longitude: number
  latitude: number
  [key: string]: string | number | boolean | null | undefined
}

export type WorkerParams = string | number[]

export interface WorkerAnwser {
  type: 'global' | 'local'
  items: Item[]
}
