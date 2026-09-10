import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import { FarmLayout } from './layouts/FarmLayout'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { CropsPage } from './pages/CropsPage'
import { FarmsPage } from './pages/FarmsPage'
import { FieldsPage } from './pages/FieldsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

function Home() {
  return (
    <div className="app">
      <header>
        <h1>AgriConnect Uganda</h1>
        <p>Manage your farm. Understand your finances. Find better market opportunities.</p>
      </header>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>
      <main>
        <p>Welcome to AgriConnect. Platform infrastructure is being set up.</p>
      </main>
    </div>
  )
}

function Dashboard() {
  const { user, logout } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app">
      <header>
        <h1>Welcome, {user.full_name || user.username}</h1>
        <p>
          {user.role === 'FARMER' ? 'Farmer' : 'Buyer'} account · {user.phone}
        </p>
      </header>
      <nav>
        <Link to="/">Home</Link>
        <button type="button" className="btn-ghost" onClick={() => void logout()}>
          Log out
        </button>
      </nav>
      <main>
        <p>Welcome back, {user.full_name || user.username}.</p>
        {user.role === 'FARMER' && (
          <p>
            Manage your <Link to="/farms">farms</Link> and <Link to="/crops">crops</Link>.
          </p>
        )}
        {user.location && (
          <p>
            {user.location}
            {user.district ? ` · ${user.district}` : ''}
          </p>
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farms" element={<FarmLayout />}>
            <Route index element={<FarmsPage />} />
            <Route path=":farmId/fields" element={<FieldsPage />} />
          </Route>
          <Route path="/crops" element={<FarmLayout />}>
            <Route index element={<CropsPage />} />
            <Route path=":cropId/activities" element={<ActivitiesPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App