import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../auth/AuthContext'
import { RegisterPage } from './RegisterPage'
import { authApi } from '../api/authApi'
import type { User } from '../auth/types'

vi.mock('../api/authApi', () => ({
  authApi: {
    register: vi.fn(),
    logout: vi.fn(),
  },
}))

const mockRegister = vi.mocked(authApi.register)

const farmer: User = {
  id: 2,
  username: 'auma.54321',
  full_name: 'Auma Rita',
  phone: '+256772111222',
  email: 'auma@example.com',
  role: 'FARMER',
  location: 'Lira City',
  district: 'Lira',
  profile_image: null,
  date_joined: '2026-09-11T00:00:00Z',
  created_at: '2026-09-11T00:00:00Z',
  updated_at: '2026-09-11T00:00:00Z',
}

afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('RegisterPage', () => {
  it('shows the registration form fields', () => {
    renderRegister()
    expect(screen.getByLabelText('Full name')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByText('I am a Farmer')).toBeInTheDocument()
    expect(screen.getByText('I am a Buyer')).toBeInTheDocument()
  })

  it('submits a FARMER registration with the entered details', async () => {
    mockRegister.mockResolvedValue({ user: farmer, access: 'a', refresh: 'r' })
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText('Full name'), 'Auma Rita')
    await user.type(screen.getByLabelText('Phone number'), '0772111222')
    await user.type(screen.getByLabelText('Email'), 'auma@example.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPass1')
    await user.type(screen.getByLabelText('Location'), 'Lira City')
    await user.type(screen.getByLabelText('District'), 'Lira')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(mockRegister).toHaveBeenCalledWith({
      full_name: 'Auma Rita',
      phone: '0772111222',
      email: 'auma@example.com',
      password: 'StrongPass1',
      role: 'FARMER',
      location: 'Lira City',
      district: 'Lira',
    })
  })

  it('switches the role to BUYER', async () => {
    mockRegister.mockResolvedValue({ user: farmer, access: 'a', refresh: 'r' })
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByText('I am a Buyer'))
    await user.type(screen.getByLabelText('Full name'), 'Auma Rita')
    await user.type(screen.getByLabelText('Phone number'), '0772111222')
    await user.type(screen.getByLabelText('Email'), 'auma@example.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPass1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'BUYER' }),
    )
  })
})