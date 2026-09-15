import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../auth/AuthContext'
import { LoginPage } from './LoginPage'
import { authApi } from '../api/authApi'
import type { User } from '../auth/types'

vi.mock('../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

const mockLogin = vi.mocked(authApi.login)

const farmer: User = {
  id: 1,
  username: 'okello.12345',
  full_name: 'Okello James',
  phone: '+256772123456',
  email: 'okello@example.com',
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

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('shows the login form fields', () => {
    renderLogin()
    expect(screen.getByLabelText('Email or username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /log in/i }),
    ).toBeInTheDocument()
  })

  it('calls login with the entered credentials', async () => {
    mockLogin.mockResolvedValue({ user: farmer, access: 'a', refresh: 'r' })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email or username'), 'okello@example.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPass1')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(mockLogin).toHaveBeenCalledWith({
      identifier: 'okello@example.com',
      password: 'StrongPass1',
    })
  })

  it('shows an error message when login fails', async () => {
    mockLogin.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Invalid credentials provided' } },
    })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email or username'), 'okello@example.com')
    await user.type(screen.getByLabelText('Password'), 'WrongPass1')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByText('Invalid credentials provided')).toBeInTheDocument()
  })
})