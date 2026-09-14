import { Config } from './types'
import configs from './configs.json'

export const getConfigs = async (): Promise<Config[]> => configs as Config[]

export const getConfig = async (id: string): Promise<Config> => {
  const config = (configs as Config[]).find((c) => c.id === id)
  if (!config) throw new Error(`Config not found: ${id}`)
  return config
}
