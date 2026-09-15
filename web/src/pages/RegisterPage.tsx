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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-heading">
          <h2>Create your account</h2>
          <p>Join AgriConnect Uganda as a farmer or buyer.</p>
        </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={onSubmit} className="auth-form">
        <div className="role-picker" role="radiogroup" aria-label="Account type">
          {(['FARMER', 'BUYER'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`role-option ${role === option ? 'role-option-active' : ''}`}
              onClick={() => setRole(option)}
              aria-pressed={role === option}
            >
              {option === 'FARMER' ? 'I am a Farmer' : 'I am a Buyer'}
            </button>
          ))}
        </div>

        <label>
          Full name
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            placeholder="e.g. Okello James"
          />
        </label>

        <label>
          Phone number
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
            placeholder="e.g. 0772 123 456"
            pattern="(\+?256|0)[0-9]{9}"
            title="Enter a valid Ugandan phone number, e.g. 0772123456 or +256772123456"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="8 characters, upper & lowercase, digit"
          />
        </label>

        <div className="auth-grid">
          <label>
            Location
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lira City"
            />
          </label>

          <label>
            District
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Lira"
            />
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
        </div>
      </div>
  )
}