import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { getApiErrorMessage } from '../api/client'
import type { UserRole } from '../auth/types'

export function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Exclude<UserRole, 'ADMIN'>>('FARMER')
  const [location, setLocation] = useState('')
  const [district, setDistrict] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await register({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        role,
        location: location.trim(),
        district: district.trim(),
      })
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
            <i className="bi bi-person-plus" />
          </div>
          <h2>Create your account</h2>
          <p className="text-muted">Join AgriConnect Uganda as a farmer or buyer.</p>
        </div>

        {error && <div className="alert alert-agri-error">{error}</div>}

        <form onSubmit={onSubmit} className="agri-form">
          <div className="agri-role-picker mb-4">
            <div className="row g-2" role="radiogroup" aria-label="Account type">
              {(['FARMER', 'BUYER'] as const).map((option) => (
                <div className="col-6" key={option}>
                  <button
                    type="button"
                    className={`btn w-100 ${role === option ? 'active' : ''}`}
                    onClick={() => setRole(option)}
                    aria-pressed={role === option}
                  >
                    <i className={`bi ${option === 'FARMER' ? 'bi-house-door' : 'bi-basket'} me-1`} />
                    {option === 'FARMER' ? 'I am a Farmer' : 'I am a Buyer'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              type="text"
              className="form-control"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              placeholder="e.g. Okello James"
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-phone">Phone number</label>
              <input
                id="reg-phone"
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                placeholder="e.g. 0772 123 456"
                pattern="(\+?256|0)[0-9]{9}"
                title="Enter a valid Ugandan phone number, e.g. 0772123456 or +256772123456"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="8 characters, upper & lowercase, digit"
            />
            <div className="form-text">Min 8 chars with at least one upper, one lower and a digit.</div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-location">Location</label>
              <input
                id="reg-location"
                type="text"
                className="form-control"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Lira City"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-district">District</label>
              <input
                id="reg-district"
                type="text"
                className="form-control"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Lira"
              />
            </div>
          </div>

          <button type="submit" className="btn-agri btn w-100" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" className="fw-semibold">Log in</Link>
        </p>
      </div>
    </div>
  )
}