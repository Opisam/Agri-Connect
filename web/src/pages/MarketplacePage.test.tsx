import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MarketplacePage } from './MarketplacePage'

vi.mock('../marketplace/api', () => ({
  listingsApi: { list: vi.fn() },
  categoriesApi: { list: vi.fn() },
  ordersApi: { create: vi.fn() },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 2,
      username: 'buyer',
      full_name: 'Buyer One',
      phone: '0700000000',
      email: 'buyer@example.com',
      role: 'BUYER',
      location: 'Kampala',
      district: 'Kampala',
      profile_image: null,
      date_joined: '2026-09-01T00:00:00Z',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
  }),
}))

import { listingsApi, categoriesApi, ordersApi } from '../marketplace/api'
import type { Listing, ProduceCategory } from '../marketplace/types'

const category: ProduceCategory = {
  id: 3,
  name: 'Vegetables',
  slug: 'vegetables',
  description: '',
}

const listing: Listing = {
  id: 10,
  farmer: 1,
  farmer_name: 'Grace Auma',
  product_name: 'Fresh tomatoes',
  category: 3,
  category_name: 'Vegetables',
  quantity: '500.00',
  quantity_remaining: '500.00',
  unit: 'kg',
  price_per_unit: '3000.00',
  location: 'Lugazi',
  district: 'Mukono',
  available_from: '2026-09-20',
  description: 'Field-fresh tomatoes',
  image: null,
  status: 'ACTIVE',
  status_display: 'Active',
  created_at: '2026-09-15T00:00:00Z',
  updated_at: '2026-09-15T00:00:00Z',
}

const paged = <T,>(results: T[]) => ({ count: results.length, next: null, previous: null, results })

describe('MarketplacePage', () => {
  beforeEach(() => {
    vi.mocked(listingsApi.list).mockResolvedValue(paged([listing]))
    vi.mocked(categoriesApi.list).mockResolvedValue(paged([category]))
  })

  it('renders active listings with price and category', async () => {
    render(
      <MemoryRouter>
        <MarketplacePage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Fresh tomatoes')).toBeInTheDocument()
    expect(screen.getAllByText('Vegetables').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/3,000/)).toBeInTheDocument()
  })

  it('filters listings by search text', async () => {
    render(
      <MemoryRouter>
        <MarketplacePage />
      </MemoryRouter>,
    )
    await screen.findByText('Fresh tomatoes')
    fireEvent.change(screen.getByPlaceholderText('Product, location or district'), {
      target: { value: 'maize' },
    })
    expect(screen.queryByText('Fresh tomatoes')).not.toBeInTheDocument()
    expect(screen.getByText(/No active listings/)).toBeInTheDocument()
  })

  it('places an order when a buyer confirms', async () => {
    vi.mocked(ordersApi.create).mockResolvedValue({
      id: 1,
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
      notes: '',
      farmer_notes: '',
      created_at: '2026-09-15T00:00:00Z',
      updated_at: '2026-09-15T00:00:00Z',
    })
    render(
      <MemoryRouter>
        <MarketplacePage />
      </MemoryRouter>,
    )
    await screen.findByText('Fresh tomatoes')
    fireEvent.click(screen.getByText('Order'))
    fireEvent.change(screen.getByPlaceholderText(/Max 500/), { target: { value: '100' } })
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() => {
      expect(ordersApi.create).toHaveBeenCalledWith({
        listing: 10,
        quantity: '100',
        notes: '',
      })
    })
  })
})