import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FarmsPage } from './FarmsPage'

vi.mock('../farms/api', () => ({
  farmsApi: {
    list: vi.fn(),
  },
}))

import { farmsApi } from '../farms/api'
import type { Farm } from '../farms/types'

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

describe('FarmsPage', () => {
  beforeEach(() => {
    vi.mocked(farmsApi.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [farm],
    })
  })

  it('renders farms from the API', async () => {
    render(
      <MemoryRouter>
        <FarmsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Okello Family Farm')).toBeInTheDocument()
    expect(screen.getByText('2 fields')).toBeInTheDocument()
  })
})