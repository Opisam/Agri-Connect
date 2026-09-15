import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { notificationsApi } from '../notifications/api'
import type { Notification } from '../notifications/types'

export function NotificationsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const page = await notificationsApi.list()
      setItems(page.results)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const markRead = async (id: number) => {
    try {
      setError(null)
      await notificationsApi.markRead(id)
      void load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const markAllRead = async () => {
    try {
      setError(null)
      await notificationsApi.markAllRead()
      void load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="content">
      <div>
        <h1 className="page-title">Notifications</h1>
        <p className="page-subtitle">
          Updates about your orders and marketplace activity.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty">Loading notifications...</div>
      ) : items.length === 0 ? (
        <div className="empty">You have no notifications.</div>
      ) : (
        <>
          <section className="section">
            <div className="item-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => void markAllRead()}
              >
                Mark all as read
              </button>
            </div>
          </section>
          <section className="section">
            <div className="list">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`list-item notification${item.is_read ? ' is-read' : ''}`}
                >
                  <div>
                    <h3>
                      {item.title}
                      {!item.is_read && <span className="badge">New</span>}
                    </h3>
                    <p>{item.message}</p>
                    <p className="text-muted">
                      {formatDate(item.created_at)} · {item.notification_type}
                    </p>
                  </div>
                  {!item.is_read && (
                    <div className="item-actions">
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => void markRead(item.id)}
                      >
                        Mark as read
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}