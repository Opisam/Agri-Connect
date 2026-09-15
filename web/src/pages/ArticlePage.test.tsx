import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ArticlePage } from './ArticlePage'

vi.mock('../content/api', () => ({
  articlesApi: { detail: vi.fn() },
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

import { articlesApi } from '../content/api'
import type { Article } from '../content/types'

const article: Article = {
  id: 5,
  category: 1,
  category_name: 'Crops',
  author: 2,
  author_name: 'admin1',
  title: 'How to grow maize',
  slug: 'how-to-grow-maize',
  content: 'First paragraph.\nSecond paragraph.',
  image: null,
  is_published: true,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

describe('ArticlePage', () => {
  beforeEach(() => {
    vi.mocked(articlesApi.detail).mockResolvedValue(article)
  })

  it('renders a full article from the API', async () => {
    render(
      <MemoryRouter initialEntries={['/guides/5']}>
        <Routes>
          <Route path="/guides/:articleId" element={<ArticlePage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('How to grow maize')).toBeInTheDocument()
    expect(screen.getByText('First paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Crops')).toBeInTheDocument()
    expect(screen.getByText(/admin1/)).toBeInTheDocument()
    expect(articlesApi.detail).toHaveBeenCalledWith(5)
  })

  it('shows the error message when the article cannot be loaded', async () => {
    vi.mocked(articlesApi.detail).mockRejectedValue(new Error('Server error'))
    render(
      <MemoryRouter initialEntries={['/guides/99']}>
        <Routes>
          <Route path="/guides/:articleId" element={<ArticlePage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText(/Something went wrong/i)).toBeInTheDocument()
  })
})