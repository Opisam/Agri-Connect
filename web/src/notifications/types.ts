export type { Paged } from '../farms/types'

export interface Notification {
  id: number
  user: number
  notification_type: string
  title: string
  message: string
  is_read: boolean
  related_object_type: string
  related_object_id: number | null
  created_at: string
  updated_at: string
}