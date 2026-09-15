import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MyListingsPage } from './MyListingsPage'

vi.mock('../marketplace/api', () => ({
  listingsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  categoriesApi: { list: vi.fn() },
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

import { listingsApi, categoriesApi } from '../marketplace/api'
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

describe('MyListingsPage', () => {
  beforeEach(() => {
    vi.mocked(listingsApi.list).mockResolvedValue(paged([listing]))
    vi.mocked(categoriesApi.list).mockResolvedValue(paged([category]))
    vi.mocked(listingsApi.create).mockResolvedValue(listing)
  })

  it('renders the farmer listing and its status badge', async () => {
    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Fresh tomatoes')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText(/500.00 \/ 500.00 kg available/)).toBeInTheDocument()
  })

  it('creates a listing via the form', async () => {
    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>,
    )
    await screen.findByText('Fresh tomatoes')
    fireEvent.change(screen.getByPlaceholderText('e.g. Fresh tomatoes'), {
      target: { value: 'Cabbages' },
    })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '200' } })
    fireEvent.change(screen.getByLabelText('Price per unit (UGX)'), { target: { value: '2000' } })
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Opit' } })
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Gulu' } })
    fireEvent.change(screen.getByLabelText('Available from'), { target: { value: '2026-09-20' } })
    fireEvent.click(screen.getByText('Create listing'))
    await waitFor(() => {
      expect(listingsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          product_name: 'Cabbages',
          category: 3,
          district: 'Gulu',
          status: 'ACTIVE',
        }),
      )
    })
  })
})