import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationsPage } from './NotificationsPage'

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'farmer',
      full_name: 'Farmer One',
      phone: '0700000000',
      email: 'farmer@example.com',
      role: 'FARMER',
      location: 'Lira',
      district: 'Lira',
      profile_image: null,
      date_joined: '2026-09-01T00:00:00Z',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
  }),
}))

vi.mock('../notifications/api', () => ({
  notificationsApi: {
    list: vi.fn(),
    unreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}))

import { notificationsApi } from '../notifications/api'
import type { Notification } from '../notifications/types'

const item: Notification = {
  id: 7,
  user: 1,
  notification_type: 'ORDER_ACCEPTED',
  title: 'Order accepted',
  message: 'Your order for Maize (50 kg) was accepted.',
  is_read: false,
  related_object_type: 'order',
  related_object_id: 9,
  created_at: '2026-09-14T10:00:00Z',
  updated_at: '2026-09-14T10:00:00Z',
}

const itemRead: Notification = {
  ...item,
  id: 8,
  title: 'Welcome',
  message: 'Thanks for joining AgriConnect.',
  is_read: true,
}

const paged = <T,>(results: T[]) => ({ count: results.length, next: null, previous: null, results })

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.mocked(notificationsApi.list).mockReset()
    vi.mocked(notificationsApi.markRead).mockReset()
    vi.mocked(notificationsApi.markAllRead).mockReset()
    vi.mocked(notificationsApi.list).mockResolvedValue(paged([item, itemRead]))
  })

  it('renders the list of notifications with unread badges', async () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Order accepted')).toBeInTheDocument()
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getAllByText('New').length).toBe(1)
  })

  it('renders an empty state when there are no notifications', async () => {
    vi.mocked(notificationsApi.list).mockResolvedValue(paged([]))
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('You have no notifications.')).toBeInTheDocument()
  })

  it('marks a single notification as read and reloads', async () => {
    vi.mocked(notificationsApi.markRead).mockResolvedValue({ ...item, is_read: true })
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByText('Mark as read'))
    expect(notificationsApi.markRead).toHaveBeenCalledWith(7)
    await vi.waitFor(() => expect(notificationsApi.list).toHaveBeenCalledTimes(2))
  })

  it('marks all notifications as read and reloads', async () => {
    vi.mocked(notificationsApi.markAllRead).mockResolvedValue(2)
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByText('Mark all as read'))
    expect(notificationsApi.markAllRead).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(notificationsApi.list).toHaveBeenCalledTimes(2))
  })
})