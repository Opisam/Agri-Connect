import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import { articlesApi, contentApi } from '../content/api'
import type { Article, ContentCategory } from '../content/types'

export function GuidesListPage() {
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setError(null)
      const [categoryPage, articlePage] = await Promise.all([
        contentApi.categories(),
        articlesApi.list(),
      ])
      setCategories(categoryPage.results)
      setArticles(articlePage.results)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = articles.filter((a) => {
    const matchSearch =
      !search || a.title.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || a.category === Number(categoryFilter)
    return matchSearch && matchCategory
  })

  return (
    <div className="content">
      <div className="agri-page-header">
        <h1><i className="bi bi-book me-2 text-success" />Agricultural Guides</h1>
        <p>Practical advice on crops, livestock and farming best practices.</p>
      </div>

      {error && <div className="alert alert-agri-error">{error}</div>}

      <div className="agri-filter-bar">
        <form
          className="row g-2"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-search text-muted" /></span>
              <input
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. maize"
              />
            </div>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="agri-empty">
            <i className="bi bi-journal-x" />
            No guides match your search.
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map((article) => (
              <div key={article.id} className="col-md-6 col-lg-4">
                <Link to={`/guides/${article.id}`} className="text-decoration-none h-100 d-block">
                  <div className="agri-card card h-100">
                    <div className="card-body">
                      <h5 className="fw-bold mb-2" style={{ color: '#1b5e20' }}>
                        <i className="bi bi-journal-text me-1 text-success" />
                        {article.title}
                      </h5>
                      <p className="mb-2">
                        {article.category_name && (
                          <span className="badge badge-agri">{article.category_name}</span>
                        )}
                        <span className="text-muted small ms-1">
                          {formatDate(article.created_at)}
                          {article.author_name ? ` · ${article.author_name}` : ''}
                        </span>
                      </p>
                      <p className="text-muted small mb-0">{summarise(article.content)}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function summarise(content: string): string {
  const text = content.replace(/\s+/g, ' ').trim()
  if (text.length <= 180) {
    return text
  }
  return `${text.slice(0, 180).trimEnd()}…`
}