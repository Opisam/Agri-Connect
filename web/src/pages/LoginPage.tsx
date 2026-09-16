import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { getApiErrorMessage } from '../api/client'

export function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await login({ identifier, password })
      navigate('/dashboard')
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="agri-auth-page">
      <div className="agri-auth-card">
        <div className="text-center mb-4">
          <div className="brand-icon">
            <i className="bi bi-flower1" />
          </div>
          <h2>Welcome back</h2>
          <p className="text-muted">Log in to continue to AgriConnect Uganda.</p>
        </div>

        {error && <div className="alert alert-agri-error">{error}</div>}

        <form onSubmit={onSubmit} className="agri-form">
          <div className="mb-3">
            <label className="form-label" htmlFor="login-identifier">Email or username</label>
            <input
              id="login-identifier"
              type="text"
              className="form-control"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-4">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Your password"
            />
          </div>

          <button type="submit" className="btn-agri btn w-100" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
          New to AgriConnect? <Link to="/register" className="fw-semibold">Create an account</Link>
        </p>
      </div>
    </div>
  )
}