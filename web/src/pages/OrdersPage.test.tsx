import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrdersPage } from './OrdersPage'

vi.mock('../marketplace/api', () => ({
  ordersApi: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'farm',
      full_name: 'Grace Auma',
      phone: '0700000001',
      email: 'farm@example.com',
      role: 'FARMER',
      location: 'Lugazi',
      district: 'Mukono',
      profile_image: null,
      date_joined: '2026-09-01T00:00:00Z',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
  }),
}))

import { ordersApi } from '../marketplace/api'
import type { Order } from '../marketplace/types'

const pendingOrder: Order = {
  id: 5,
  listing: 10,
  listing_product_name: 'Fresh tomatoes',
  listing_unit: 'kg',
  listing_price_per_unit: '3000.00',
  listing_quantity_remaining: '400.00',
  buyer: 2,
  buyer_name: 'Buyer One',
  quantity: '100.00',
  total_price: '300000.00',
  status: 'PENDING',
  status_display: 'Pending',
  notes: 'Deliver on Friday',
  farmer_notes: '',
  created_at: '2026-09-15T00:00:00Z',
  updated_at: '2026-09-15T00:00:00Z',
}

const acceptedOrder: Order = {
  ...pendingOrder,
  id: 6,
  quantity: '50.00',
  total_price: '150000.00',
  status: 'ACCEPTED',
  status_display: 'Accepted',
}

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.mocked(ordersApi.list).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [acceptedOrder, pendingOrder],
    })
    vi.mocked(ordersApi.update).mockResolvedValue(acceptedOrder)
  })

  it('renders orders received by the farmer', async () => {
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Orders Received')).toBeInTheDocument()
    expect(screen.getAllByText('Fresh tomatoes').length).toBe(2)
    expect(screen.getAllByText(/Buyer: Buyer One/).length).toBe(2)
    expect(screen.getAllByText(/Buyer note: Deliver on Friday/).length).toBe(2)
  })

  it('accepts a pending order when the farmer clicks accept', async () => {
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>,
    )
    await screen.findByText('Orders Received')
    const acceptButtons = screen.getAllByText('Accept')
    fireEvent.click(acceptButtons[0])
    await waitFor(() => {
      expect(ordersApi.update).toHaveBeenCalledWith(5, { status: 'ACCEPTED' })
    })
  })

  it('offers complete for accepted orders', async () => {
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>,
    )
    await screen.findByText('Orders Received')
    fireEvent.click(screen.getByText('Mark complete'))
    await waitFor(() => {
      expect(ordersApi.update).toHaveBeenCalledWith(6, { status: 'COMPLETED' })
    })
  })
})