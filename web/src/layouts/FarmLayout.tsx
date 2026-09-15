import { Link, Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { NotificationBell } from '../components/NotificationBell'

export function FarmLayout() {
  const { user, logout } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'FARMER') {
    return (
      <div className="app">
        <p>Only farmers have access to farm management. <Link to="/dashboard">Go back</Link></p>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>Farm Management</h1>
        <p>{user.full_name || user.username}</p>
      </header>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/farms">Farms</Link>
        <Link to="/crops">Crops</Link>
        <Link to="/finance">Finances</Link>
        <Link to="/marketplace">Marketplace</Link>
        <Link to="/markets/prices">Market Prices</Link>
        <Link to="/guides">Guides</Link>
        <NotificationBell />
        <button type="button" className="btn-ghost" onClick={() => void logout()}>
          Log out
        </button>
      </nav>
      <Outlet />
    </div>
  )
}