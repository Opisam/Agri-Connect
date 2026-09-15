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
        <div className="alert alert-error">{error}</div>
        <p>
          <Link to="/guides">← Back to guides</Link>
        </p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="content">
        <p>
          <Link to="/guides">← Back to guides</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="content">
      <p>
        <Link to="/guides">← Back to guides</Link>
      </p>
      <div>
        <h1 className="page-title">{article.title}</h1>
        <p className="page-subtitle">
          {article.category_name && (
            <span className="badge">{article.category_name}</span>
          )}
          {''}· {formatDate(article.created_at)}
          {article.author_name ? ` · ${article.author_name}` : ''}
        </p>
      </div>

      {article.image && <img src={article.image} alt={article.title} className="article-image" />}

      <section className="section">
        <article className="prose">
          {article.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </article>
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