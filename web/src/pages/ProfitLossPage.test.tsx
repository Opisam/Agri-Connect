import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfitLossPage } from './ProfitLossPage'

vi.mock('../finance/api', () => ({
  profitLossApi: {
    get: vi.fn(),
  },
}))

vi.mock('../farms/api', () => ({
  farmsApi: { list: vi.fn() },
  cropsApi: { list: vi.fn() },
}))

import { profitLossApi } from '../finance/api'
import { farmsApi, cropsApi } from '../farms/api'

describe('ProfitLossPage', () => {
  beforeEach(() => {
    vi.mocked(profitLossApi.get).mockResolvedValue({
      total_expenses: '2000000.00',
      total_revenue: '4500000.00',
      profit_loss: '2500000.00',
      expense_count: 3,
      sale_count: 2,
    })
    vi.mocked(farmsApi.list).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
    vi.mocked(cropsApi.list).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  })

  it('renders the dashboard title and summary cards', async () => {
    render(
      <MemoryRouter>
        <ProfitLossPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Farm Finances')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/2,500,000/)).toBeInTheDocument()
    })
    expect(screen.getByText(/3 expense/)).toBeInTheDocument()
    expect(screen.getByText(/2 sale/)).toBeInTheDocument()
  })
})
