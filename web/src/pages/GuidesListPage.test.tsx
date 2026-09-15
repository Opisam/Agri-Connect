import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GuidesListPage } from './GuidesListPage'

vi.mock('../content/api', () => ({
  contentApi: { categories: vi.fn() },
  articlesApi: { list: vi.fn(), detail: vi.fn() },
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

import { articlesApi, contentApi } from '../content/api'
import type { Article, ContentCategory } from '../content/types'

const crops: ContentCategory = {
  id: 1,
  name: 'Crops',
  slug: 'crops',
  description: 'Guides on crop planting.',
}

const article: Article = {
  id: 5,
  category: 1,
  category_name: 'Crops',
  author: null,
  author_name: null,
  title: 'How to grow maize',
  slug: 'how-to-grow-maize',
  content: 'Plant maize in well-drained soils.',
  image: null,
  is_published: true,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

const paged = <T,>(results: T[]) => ({ count: results.length, next: null, previous: null, results })

describe('GuidesListPage', () => {
  beforeEach(() => {
    vi.mocked(contentApi.categories).mockResolvedValue(paged([crops]))
    vi.mocked(articlesApi.list).mockResolvedValue(paged([article]))
  })

  it('renders the published guides from the API', async () => {
    render(
      <MemoryRouter>
        <GuidesListPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('How to grow maize')).toBeInTheDocument()
    expect(screen.getAllByText('Crops').length).toBeGreaterThanOrEqual(2)
  })

  it('filters guides by search input', async () => {
    render(
      <MemoryRouter>
        <GuidesListPage />
      </MemoryRouter>,
    )
    const input = await screen.findByPlaceholderText('e.g. maize')
    fireEvent.change(input, { target: { value: 'beans' } })
    expect(screen.getByText('No guides match your search.')).toBeInTheDocument()
  })

  it('filters guides by category', async () => {
    const livestock: Article = {
      ...article,
      id: 6,
      title: 'Goat rearing basics',
      category: null,
      category_name: null,
    }
    vi.mocked(articlesApi.list).mockResolvedValue(paged([article, livestock]))
    render(
      <MemoryRouter>
        <GuidesListPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('How to grow maize')).toBeInTheDocument()
    expect(screen.getByText('Goat rearing basics')).toBeInTheDocument()
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: '1' } })
    expect(screen.queryByText('Goat rearing basics')).not.toBeInTheDocument()
  })
})