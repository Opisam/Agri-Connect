import { api, type ApiEnvelope, unwrap } from '../api/client'
import type { Market, MarketPrice, Paged } from './types'

export const marketsApi = {
  async list(): Promise<Paged<Market>> {
    const { data } = await api.get<ApiEnvelope<Paged<Market>>>('/markets/')
    return unwrap(data)
  },
}

export const pricesApi = {
  async current(): Promise<MarketPrice[]> {
    const { data } = await api.get<ApiEnvelope<MarketPrice[]>>('/markets/prices/current/')
    return unwrap(data)
  },
  async history(params: { market?: number; product?: string }): Promise<MarketPrice[]> {
    const { data } = await api.get<ApiEnvelope<MarketPrice[]>>('/markets/prices/history/', {
      params,
    })
    return unwrap(data)
  },
}