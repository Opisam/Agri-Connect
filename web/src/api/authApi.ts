import { api, type ApiEnvelope, unwrap } from './client'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../auth/types'

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiEnvelope<AuthResponse>>('/auth/login/', payload)
    return unwrap(data)
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiEnvelope<AuthResponse>>('/auth/register/', payload)
    return unwrap(data)
  },

  async me(): Promise<User> {
    const { data } = await api.get<ApiEnvelope<User>>('/auth/me/')
    return unwrap(data)
  },

  async logout(refresh: string): Promise<void> {
    await api.post('/auth/logout/', { refresh })
  },
}