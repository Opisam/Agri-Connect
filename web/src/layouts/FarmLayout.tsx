import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { NotificationBell } from '../components/NotificationBell'

export function FarmLayout() {
  const { user, logout } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'FARMER') {
    return (
      <div className="container py-5">
        <div className="alert alert-agri-error">
          Only farmers have access to farm management.{' '}
          <Link to="/dashboard" className="fw-bold">Go back</Link>
        </div>
      </div>
    )
  }

  const links = [
    { to: '/farms', icon: 'bi-house-door', label: 'Farms' },
    { to: '/crops', icon: 'bi-flower1', label: 'Crops' },
    { to: '/finance', icon: 'bi-wallet2', label: 'Finances' },
    { to: '/marketplace', icon: 'bi-basket', label: 'Marketplace' },
    { to: '/markets/prices', icon: 'bi-graph-up', label: 'Prices' },
    { to: '/guides', icon: 'bi-book', label: 'Guides' },
  ]

  return (
    <>
      <nav className="navbar navbar-expand-md agri-navbar sticky-top">
        <div className="container">
          <Link to="/" className="navbar-brand">
            <i className="bi bi-flower1" /> Farm Management
          </Link>
          <span className="d-none d-md-inline text-white-50" style={{ fontSize: '0.85rem' }}>
            {user.full_name || user.username}
          </span>
          <button
            className="navbar-toggler agri-navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#farmNav"
            aria-controls="farmNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon agri-navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="farmNav">
            <ul className="navbar-nav ms-auto align-items-md-center">
              {links.map((link) => (
                <li className="nav-item" key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/farms' || link.to === '/crops' || link.to === '/finance'}
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  >
                    <i className={`bi ${link.icon}`} />
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li className="nav-item">
                <NotificationBell />
              </li>
              <li className="nav-item ms-lg-2 mt-2 mt-md-0">
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm rounded-pill"
                  onClick={() => void logout()}
                >
                  <i className="bi bi-box-arrow-right me-1" />Log out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="container py-4">
        <Outlet />
      </div>
    </>
  )
}