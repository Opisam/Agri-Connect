import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExpensesPage } from './ExpensesPage'

vi.mock('../finance/api', () => ({
  expensesApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('../farms/api', () => ({
  farmsApi: { list: vi.fn() },
  cropsApi: { list: vi.fn() },
}))

import { expensesApi } from '../finance/api'
import { farmsApi, cropsApi } from '../farms/api'
import type { Expense } from '../finance/types'
import type { Farm, Crop } from '../farms/types'

const farm: Farm = {
  id: 1,
  owner: 1,
  name: 'Okello Family Farm',
  location: 'Opit',
  district: 'Gulu',
  subcounty: 'Paicho',
  size: '10.00',
  size_unit: 'acres',
  farm_type: 'crop_farming',
  description: '',
  field_count: 2,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

const crop: Crop = {
  id: 1,
  farm: 1,
  farm_name: 'Okello Family Farm',
  field_id: 1,
  field_name: 'Field A',
  crop_type: 'maize',
  crop_type_display: 'Maize',
  variety: 'Longe 5',
  planting_date: null,
  expected_harvest_date: null,
  status: 'PLANTED',
  status_display: 'Planted',
  notes: '',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

const expense: Expense = {
  id: 1,
  farm: 1,
  farm_name: 'Okello Family Farm',
  crop: null,
  crop_name: null,
  category: 'Seeds',
  category_display: 'Seeds',
  amount: '50000.00',
  date: '2026-09-15',
  description: 'Maize seeds',
  notes: '',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

describe('ExpensesPage', () => {
  beforeEach(() => {
    vi.mocked(expensesApi.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [expense],
    })
    vi.mocked(farmsApi.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [farm],
    })
    vi.mocked(cropsApi.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [crop],
    })
  })

  it('renders expenses from the API', async () => {
    render(
      <MemoryRouter>
        <ExpensesPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/Maize seeds/)).toBeInTheDocument()
    expect(screen.getByText(/50,000/)).toBeInTheDocument()
  })
})
