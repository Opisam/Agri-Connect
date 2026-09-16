import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { notificationsApi } from '../notifications/api'

export function NotificationBell() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const value = await notificationsApi.unreadCount()
        if (active) {
          setCount(value)
        }
      } catch {
        if (active) {
          setCount(null)
        }
      }
    }

    void load()
    const timer = setInterval(() => void load(), 30_000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  return (
    <span className="agri-notification-bell d-inline-flex align-items-center">
      <Link to="/notifications" className="nav-link position-relative px-2" aria-label="Notifications">
        <i className="bi bi-bell fs-5" />
        {count ? <span className="notification-count">{count > 9 ? '9+' : count}</span> : null}
      </Link>
    </span>
  )
}