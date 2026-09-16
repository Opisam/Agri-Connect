import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import { articlesApi } from '../content/api'
import type { Article } from '../content/types'

export function ArticlePage() {
  const { articleId } = useParams<{ articleId: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!articleId) {
      return
    }
    const load = async () => {
      try {
        setError(null)
        const data = await articlesApi.detail(Number(articleId))
        setArticle(data)
      } catch (err) {
        setError(getApiErrorMessage(err))
      }
    }
    void load()
  }, [articleId])

  if (error) {
    return (
      <div className="content">
        <div className="alert alert-agri-error">{error}</div>
        <p>
          <Link to="/guides"><i className="bi bi-arrow-left me-1" />Back to guides</Link>
        </p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="content">
        <p>
          <Link to="/guides"><i className="bi bi-arrow-left me-1" />Back to guides</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="content">
      <Link to="/guides" className="text-decoration-none">
        <i className="bi bi-arrow-left me-1" />Back to guides
      </Link>
      <div className="agri-page-header">
        <h1><i className="bi bi-journal-text me-2 text-success" />{article.title}</h1>
        <p>
          {article.category_name && (
            <span className="badge badge-agri me-1">{article.category_name}</span>
          )}
          · {formatDate(article.created_at)}
          {article.author_name ? ` · ${article.author_name}` : ''}
        </p>
      </div>

      {article.image && <img src={article.image} alt={article.title} className="agri-article-image" />}

      <div className="agri-card card">
        <div className="card-body">
          <article className="agri-prose">
            {article.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </article>
        </div>
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