import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MarketPricesPage } from './MarketPricesPage'

vi.mock('../markets/api', () => ({
  marketsApi: { list: vi.fn() },
  pricesApi: { current: vi.fn(), history: vi.fn() },
}))

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

import { marketsApi, pricesApi } from '../markets/api'
import type { Market, MarketPrice } from '../markets/types'

const market: Market = {
  id: 1,
  name: 'Lira Main Market',
  district: 'Lira',
  location: 'Adyel',
  description: '',
  is_active: true,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

const currentPrice: MarketPrice = {
  id: 21,
  product: 'Maize',
  market: 1,
  market_name: 'Lira Main Market',
  price: '1500.00',
  unit: 'kg',
  price_date: '2026-09-14',
  source: 'KCCA',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

const historyRow: MarketPrice = {
  id: 20,
  product: 'Maize',
  market: 1,
  market_name: 'Lira Main Market',
  price: '1400.00',
  unit: 'kg',
  price_date: '2026-09-01',
  source: 'KCCA',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

const paged = <T,>(results: T[]) => ({ count: results.length, next: null, previous: null, results })

describe('MarketPricesPage', () => {
  beforeEach(() => {
    vi.mocked(marketsApi.list).mockResolvedValue(paged([market]))
    vi.mocked(pricesApi.current).mockResolvedValue([currentPrice])
  })

  it('renders current market prices', async () => {
    render(
      <MemoryRouter>
        <MarketPricesPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Maize')).toBeInTheDocument()
    expect(screen.getByText(/1,500/)).toBeInTheDocument()
    expect(screen.getAllByText('Lira Main Market').length).toBeGreaterThanOrEqual(2)
  })

  it('filters prices by product search', async () => {
    render(
      <MemoryRouter>
        <MarketPricesPage />
      </MemoryRouter>,
    )
    const input = await screen.findByPlaceholderText('e.g. maize')
    fireEvent.change(input, { target: { value: 'beans' } })
    expect(screen.getByText('No market prices match your search.')).toBeInTheDocument()
  })

  it('loads and shows price history on demand', async () => {
    vi.mocked(pricesApi.history).mockResolvedValue([historyRow])
    render(
      <MemoryRouter>
        <MarketPricesPage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByText('View history'))
    await waitFor(() =>
      expect(pricesApi.history).toHaveBeenCalledWith({ market: 1, product: 'Maize' }),
    )
    expect(await screen.findByText('2026-09-01')).toBeInTheDocument()
    expect(screen.getByText('Hide history')).toBeInTheDocument()
  })

  it('toggles history open and closed', async () => {
    vi.mocked(pricesApi.history).mockResolvedValue([historyRow])
    render(
      <MemoryRouter>
        <MarketPricesPage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByText('View history'))
    expect(await screen.findByText('Hide history')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Hide history'))
    expect(screen.getByText('View history')).toBeInTheDocument()
  })
})