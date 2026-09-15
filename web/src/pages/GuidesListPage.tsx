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
      <div>
        <h1 className="page-title">Agricultural Guides</h1>
        <p className="page-subtitle">
          Practical advice on crops, livestock and farming best practices.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label className="form-field">
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. maize"
            />
          </label>
          <label className="form-field">
            Category
            <select
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
          </label>
        </form>
      </section>

      <section className="section">
        {filtered.length === 0 ? (
          <div className="empty">No guides match your search.</div>
        ) : (
          <div className="list">
            {filtered.map((article) => (
              <div key={article.id} className="list-item">
                <h3>
                  <Link to={`/guides/${article.id}`}>{article.title}</Link>
                </h3>
                <p>
                  {article.category_name && (
                    <span className="badge">{article.category_name}</span>
                  )}
                  <span className="text-muted">
                    {' '}· {formatDate(article.created_at)}
                    {article.author_name ? ` · ${article.author_name}` : ''}
                  </span>
                </p>
                <p className="text-muted">{summarise(article.content)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
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