import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export interface ApiEnvelope<T> {
  status: 'success' | 'error'
  data: T
}

export const unwrap = <T>(envelope: ApiEnvelope<T>): T => envelope.data

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh')
      if (refresh) {
        try {
          const { data } = await axios.post<ApiEnvelope<{ access: string }>>(
            `${API_BASE_URL}/auth/token/refresh/`,
            { refresh },
          )
          localStorage.setItem('access', data.data.access)
          original.headers.Authorization = `Bearer ${data.data.access}`
          return api(original)
        } catch {
          localStorage.removeItem('access')
          localStorage.removeItem('refresh')
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api