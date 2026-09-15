import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import { FarmLayout } from './layouts/FarmLayout'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { CropsPage } from './pages/CropsPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { FarmsPage } from './pages/FarmsPage'
import { FieldsPage } from './pages/FieldsPage'
import { HarvestsPage } from './pages/HarvestsPage'
import { LoginPage } from './pages/LoginPage'
import { MarketplacePage } from './pages/MarketplacePage'
import { MyListingsPage } from './pages/MyListingsPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProfitLossPage } from './pages/ProfitLossPage'
import { RegisterPage } from './pages/RegisterPage'
import { SalesPage } from './pages/SalesPage'

function Home() {
  return (
    <div className="app">
      <header>
        <h1>AgriConnect Uganda</h1>
        <p>Manage your farm. Understand your finances. Find better market opportunities.</p>
      </header>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/marketplace">Marketplace</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>
      <main>
        <p>Welcome to AgriConnect. Find produce, manage your farm, and understand your finances.</p>
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
            Manage your <Link to="/farms">farms</Link>,{' '}
            <Link to="/crops">crops</Link> and{' '}
            <Link to="/marketplace/my-listings">marketplace listings</Link>.
          </p>
        )}
        {user.role === 'BUYER' && (
          <p>
            Browse the <Link to="/marketplace">marketplace</Link> to buy fresh produce.
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

function MarketplaceLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="app">
      <header>
        <h1>Marketplace</h1>
        {user && <p>{user.full_name || user.username} · {user.role === 'FARMER' ? 'Farmer' : 'Buyer'}</p>}
      </header>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/marketplace">Browse</Link>
        {user?.role === 'FARMER' && <Link to="/marketplace/my-listings">My Listings</Link>}
        {user && <Link to="/marketplace/orders">Orders</Link>}
        {user?.role === 'FARMER' && <Link to="/farms">Farms</Link>}
        {user && (
          <button type="button" className="btn-ghost" onClick={() => void logout()}>
            Log out
          </button>
        )}
      </nav>
      <Outlet />
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
          <Route path="/finance" element={<FarmLayout />}>
            <Route index element={<ProfitLossPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="harvests" element={<HarvestsPage />} />
            <Route path="sales" element={<SalesPage />} />
          </Route>
          <Route path="/marketplace" element={<MarketplaceLayout />}>
            <Route index element={<MarketplacePage />} />
            <Route path="my-listings" element={<MyListingsPage />} />
            <Route path="orders" element={<OrdersPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App