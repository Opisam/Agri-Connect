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

  const unreadCount = items.filter((i) => !i.is_read).length

  return (
    <div className="agri-auth-page py-5">
      <div className="container">
        <div className="agri-page-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h1><i className="bi bi-bell me-2 text-success" />Notifications</h1>
            <p>Updates about your orders and marketplace activity.</p>
          </div>
          {items.length > 0 && (
            <button type="button" className="btn-agri-outline" onClick={() => void markAllRead()}>
              <i className="bi bi-check2-all me-1" />Mark all as read
            </button>
          )}
        </div>

        {error && <div className="alert alert-agri-error">{error}</div>}

        <div className="agri-card card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span><i className="bi bi-inbox me-1 text-success" />All Notifications ({items.length})</span>
            {unreadCount > 0 && (
              <span className="badge badge-pending">{unreadCount} unread</span>
            )}
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border text-success" role="status" />
                <div className="mt-2">Loading notifications...</div>
              </div>
            ) : items.length === 0 ? (
              <div className="agri-empty">
                <i className="bi bi-bell-slash" />
                You have no notifications.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`agri-list-item ${item.is_read ? 'opacity-75' : 'border-success'}`}
                  >
                    <div>
                      <h5>
                        <i className={`bi ${item.is_read ? 'bi-envelope-open me-1' : 'bi-envelope me-1 text-success'}`} />
                        {item.title}
                        {!item.is_read && <span className="badge badge-active ms-2">New</span>}
                      </h5>
                      <p>{item.message}</p>
                      <p className="text-muted small mb-0">
                        {formatDate(item.created_at)} · {item.notification_type}
                      </p>
                    </div>
                    {!item.is_read && (
                      <div className="list-actions">
                        <button
                          type="button"
                          className="btn-agri-outline btn-sm"
                          onClick={() => void markRead(item.id)}
                        >
                          <i className="bi bi-check2 me-1" />Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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