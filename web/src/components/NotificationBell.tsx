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
    <span className="notification-bell">
      <Link to="/notifications">
        Notifications{count ? ` (${count})` : ''}
      </Link>
    </span>
  )
}