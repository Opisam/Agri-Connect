import { api, type ApiEnvelope, unwrap } from '../api/client'
import type {
  Crop,
  CropActivity,
  CropActivityPayload,
  CropPayload,
  Farm,
  FarmPayload,
  Field,
  FieldPayload,
  Paged,
} from './types'

export const farmsApi = {
  async list(): Promise<Paged<Farm>> {
    const { data } = await api.get<ApiEnvelope<Paged<Farm>>>('/farms/')
    return unwrap(data)
  },
  async create(payload: FarmPayload): Promise<Farm> {
    const { data } = await api.post<ApiEnvelope<Farm>>('/farms/', payload)
    return unwrap(data)
  },
  async update(id: number, payload: Partial<FarmPayload>): Promise<Farm> {
    const { data } = await api.patch<ApiEnvelope<Farm>>(`/farms/${id}/`, payload)
    return unwrap(data)
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/farms/${id}/`)
  },
}

export const fieldsApi = {
  async list(farmId: number): Promise<Paged<Field>> {
    const { data } = await api.get<ApiEnvelope<Paged<Field>>>(`/farms/${farmId}/fields/`)
    return unwrap(data)
  },
  async create(farmId: number, payload: FieldPayload): Promise<Field> {
    const { data } = await api.post<ApiEnvelope<Field>>(`/farms/${farmId}/fields/`, payload)
    return unwrap(data)
  },
  async update(id: number, payload: Partial<FieldPayload>): Promise<Field> {
    const { data } = await api.patch<ApiEnvelope<Field>>(`/fields/${id}/`, payload)
    return unwrap(data)
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/fields/${id}/`)
  },
}

export const cropsApi = {
  async list(): Promise<Paged<Crop>> {
    const { data } = await api.get<ApiEnvelope<Paged<Crop>>>('/crops/')
    return unwrap(data)
  },
  async create(payload: CropPayload): Promise<Crop> {
    const { data } = await api.post<ApiEnvelope<Crop>>('/crops/', payload)
    return unwrap(data)
  },
  async update(id: number, payload: Partial<CropPayload>): Promise<Crop> {
    const { data } = await api.patch<ApiEnvelope<Crop>>(`/crops/${id}/`, payload)
    return unwrap(data)
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/crops/${id}/`)
  },
}

export const activitiesApi = {
  async list(cropId: number): Promise<Paged<CropActivity>> {
    const { data } = await api.get<ApiEnvelope<Paged<CropActivity>>>(
      `/crops/${cropId}/activities/`,
    )
    return unwrap(data)
  },
  async create(cropId: number, payload: CropActivityPayload): Promise<CropActivity> {
    const { data } = await api.post<ApiEnvelope<CropActivity>>(
      `/crops/${cropId}/activities/`,
      payload,
    )
    return unwrap(data)
  },
  async update(id: number, payload: Partial<CropActivityPayload>): Promise<CropActivity> {
    const { data } = await api.patch<ApiEnvelope<CropActivity>>(`/activities/${id}/`, payload)
    return unwrap(data)
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/activities/${id}/`)
  },
}