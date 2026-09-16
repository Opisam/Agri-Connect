import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import { ArticlePage } from './pages/ArticlePage'
import { NotificationBell } from './components/NotificationBell'
import { FarmLayout } from './layouts/FarmLayout'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { CropsPage } from './pages/CropsPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { FarmsPage } from './pages/FarmsPage'
import { FieldsPage } from './pages/FieldsPage'
import { GuidesListPage } from './pages/GuidesListPage'
import { HarvestsPage } from './pages/HarvestsPage'
import { LoginPage } from './pages/LoginPage'
import { MarketplacePage } from './pages/MarketplacePage'
import { MarketPricesPage } from './pages/MarketPricesPage'
import { MyListingsPage } from './pages/MyListingsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProfitLossPage } from './pages/ProfitLossPage'
import { RegisterPage } from './pages/RegisterPage'
import { SalesPage } from './pages/SalesPage'

function Footer() {
  return (
    <footer className="agri-footer">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6">
            <strong>AgriConnect Uganda</strong>
            <div className="mt-1" style={{ fontSize: '0.9rem', opacity: 0.85 }}>
              Manage your farm. Understand your finances. Find better market opportunities.
            </div>
          </div>
          <div className="col-md-6 text-md-end mt-3 mt-md-0" style={{ fontSize: '0.9rem' }}>
            <Link to="/marketplace" className="me-3">Marketplace</Link>
            <Link to="/markets/prices" className="me-3">Market Prices</Link>
            <Link to="/guides">Guides</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function PublicNav({ links }: { links: { to: string; icon: string; label: string }[] }) {
  return (
    <nav className="navbar navbar-expand-md agri-navbar sticky-top">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <i className="bi bi-flower1" /> AgriConnect <span style={{ color: '#ffb300' }}>Uganda</span>
        </Link>
        <button
          className="navbar-toggler agri-navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon agri-navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {links.map((link) => (
              <li className="nav-item" key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <i className={`bi ${link.icon}`} />
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}

function AuthenticatedNav({ links }: { links: { to: string; icon: string; label: string }[] }) {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar navbar-expand-md agri-navbar sticky-top">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <i className="bi bi-flower1" /> AgriConnect <span style={{ color: '#ffb300' }}>Uganda</span>
        </Link>
        <span className="d-none d-md-inline text-white-50" style={{ fontSize: '0.85rem' }}>
          {user?.full_name || user?.username}
        </span>
        <button
          className="navbar-toggler agri-navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarAuth"
          aria-controls="navbarAuth"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon agri-navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarAuth">
          <ul className="navbar-nav ms-auto align-items-md-center">
            {links.map((link) => (
              <li className="nav-item" key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <i className={`bi ${link.icon}`} />
                  {link.label}
                </NavLink>
              </li>
            ))}
            {user && (
              <li className="nav-item">
                <NotificationBell />
              </li>
            )}
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
  )
}

function Home() {
  return (
    <>
      <PublicNav
        links={[
          { to: '/', icon: 'bi-house-door', label: 'Home' },
          { to: '/marketplace', icon: 'bi-basket', label: 'Marketplace' },
          { to: '/markets/prices', icon: 'bi-graph-up', label: 'Market Prices' },
          { to: '/guides', icon: 'bi-book', label: 'Guides' },
        ]}
      />
      <header className="agri-hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1>
                <i className="bi bi-flower1 me-2" />
                AgriConnect Uganda
              </h1>
              <p className="mb-3">
                Manage your farm. Understand your finances. Find better market opportunities.
              </p>
              <div className="d-flex gap-2 flex-wrap">
                <Link to="/register" className="btn btn-accent">
                  <i className="bi bi-person-plus me-1" /> Get Started
                </Link>
                <Link to="/marketplace" className="btn btn-outline-light">
                  <i className="bi bi-arrow-right-circle me-1" /> Explore the Marketplace
                </Link>
              </div>
            </div>
            <div className="col-lg-4 d-none d-lg-block text-end">
              <i className="bi bi-basket2" style={{ fontSize: '6rem', opacity: 0.35 }} />
            </div>
          </div>
        </div>
      </header>
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-md-4">
            <div className="agri-card card h-100">
              <div className="card-body text-center">
                <div className="bi bi-emoji-smile" style={{ fontSize: '2.5rem', color: '#2e7d32' }} />
                <h5 className="fw-bold mt-2">Manage your farm</h5>
                <p className="text-muted mb-0">
                  Record farms, fields, crops and every farming activity in one place.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="agri-card card h-100">
              <div className="card-body text-center">
                <div className="bi bi-cash-coin" style={{ fontSize: '2.5rem', color: '#ff8f00' }} />
                <h5 className="fw-bold mt-2">Understand your finances</h5>
                <p className="text-muted mb-0">
                  Track expenses, harvests and sales to see your real profit or loss.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="agri-card card h-100">
              <div className="card-body text-center">
                <div className="bi bi-graph-up" style={{ fontSize: '2.5rem', color: '#1565c0' }} />
                <h5 className="fw-bold mt-2">Find better market opportunities</h5>
                <p className="text-muted mb-0">
                  Browse live listings, market prices and connect with buyers directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function Dashboard() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const farmerLinks = [
    { to: '/farms', icon: 'bi-house-door', label: 'Farms' },
    { to: '/crops', icon: 'bi-flower1', label: 'Crops' },
    { to: '/finance', icon: 'bi-wallet2', label: 'Finances' },
    { to: '/marketplace/my-listings', icon: 'bi-basket', label: 'Listings' },
  ]
  const buyerLinks = [
    { to: '/marketplace', icon: 'bi-basket', label: 'Marketplace' },
    { to: '/marketplace/orders', icon: 'bi-cart-check', label: 'Orders' },
  ]
  const commonLinks = [
    { to: '/markets/prices', icon: 'bi-graph-up', label: 'Prices' },
    { to: '/guides', icon: 'bi-book', label: 'Guides' },
  ]

  return (
    <>
      <AuthenticatedNav
        links={[...(user.role === 'FARMER' ? farmerLinks : buyerLinks), ...commonLinks]}
      />
      <div className="container py-4">
        <div className="agri-page-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h1>
              <i className="bi bi-person-circle me-2 text-success" />
              Hello, {user.full_name || user.username}
            </h1>
            <p>
              {user.role === 'FARMER' ? 'Farmer' : 'Buyer'} account · {user.phone}
              {user.location ? ` · ${user.location}${user.district ? `, ${user.district}` : ''}` : ''}
            </p>
          </div>
        </div>

        <div className="agri-quick-nav">
          {user.role === 'FARMER' && (
            <>
              <Link to="/finance" className="btn btn-agri-outline">
                <i className="bi bi-bar-chart-line me-1" /> Farm Finances
              </Link>
              <Link to="/finance/expenses" className="btn btn-agri-outline">
                <i className="bi bi-receipt me-1" /> Expenses
              </Link>
              <Link to="/finance/harvests" className="btn btn-agri-outline">
                <i className="bi bi-box-seam me-1" /> Harvests
              </Link>
              <Link to="/finance/sales" className="btn btn-agri-outline">
                <i className="bi bi-tag me-1" /> Sales
              </Link>
              <Link to="/marketplace/my-listings" className="btn btn-agri-outline">
                <i className="bi bi-megaphone me-1" /> My Listings
              </Link>
              <Link to="/marketplace/orders" className="btn btn-agri-outline">
                <i className="bi bi-cart-check me-1" /> Orders
              </Link>
            </>
          )}
          {user.role === 'BUYER' && (
            <Link to="/marketplace" className="btn btn-agri">
              <i className="bi bi-basket me-1" /> Browse Marketplace
            </Link>
          )}
        </div>

        <div className="row g-4">
          {user.role === 'FARMER' ? (
            <>
              <div className="col-6 col-md-4 col-lg-2">
                <div className="agri-stat-card text-center">
                  <div className="stat-icon green mx-auto mb-2"><i className="bi bi-house-door" /></div>
                  <div className="stat-value">Farms</div>
                  <div className="stat-meta">Create & manage</div>
                </div>
              </div>
              <div className="col-6 col-md-4 col-lg-2">
                <div className="agri-stat-card text-center">
                  <div className="stat-icon green mx-auto mb-2"><i className="bi bi-flower1" /></div>
                  <div className="stat-value">Crops</div>
                  <div className="stat-meta">Track growth</div>
                </div>
              </div>
              <div className="col-6 col-md-4 col-lg-2">
                <div className="agri-stat-card text-center">
                  <div className="stat-icon red mx-auto mb-2"><i className="bi bi-receipt" /></div>
                  <div className="stat-value">Expenses</div>
                  <div className="stat-meta">Record costs</div>
                </div>
              </div>
              <div className="col-6 col-md-4 col-lg-2">
                <div className="agri-stat-card text-center">
                  <div className="stat-icon orange mx-auto mb-2"><i className="bi bi-basket" /></div>
                  <div className="stat-value">Listings</div>
                  <div className="stat-meta">Sell produce</div>
                </div>
              </div>
              <div className="col-6 col-md-4 col-lg-2">
                <div className="agri-stat-card text-center">
                  <div className="stat-icon blue mx-auto mb-2"><i className="bi bi-cart-check" /></div>
                  <div className="stat-value">Orders</div>
                  <div className="stat-meta">Manage requests</div>
                </div>
              </div>
              <div className="col-6 col-md-4 col-lg-2">
                <div className="agri-stat-card text-center">
                  <div className="stat-icon orange mx-auto mb-2"><i className="bi bi-graph-up" /></div>
                  <div className="stat-value">Prices</div>
                  <div className="stat-meta">Market data</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="col-md-6">
                <div className="agri-stat-card">
                  <div className="stat-icon green mb-2"><i className="bi bi-basket" /></div>
                  <div className="stat-value">Browse Produce</div>
                  <div className="stat-meta">Fresh listings from local farmers</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="agri-stat-card">
                  <div className="stat-icon blue mb-2"><i className="bi bi-cart-check" /></div>
                  <div className="stat-value">My Orders</div>
                  <div className="stat-meta">Track order status</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

function MarketplaceLayout() {
  const { user } = useAuth()

  return (
    <>
      <AuthenticatedNav
        links={[
          { to: '/marketplace', icon: 'bi-basket', label: 'Browse' },
          ...(user?.role === 'FARMER'
            ? [{ to: '/marketplace/my-listings', icon: 'bi-megaphone', label: 'My Listings' }]
            : []),
          { to: '/marketplace/orders', icon: 'bi-cart-check', label: 'Orders' },
          { to: '/markets/prices', icon: 'bi-graph-up', label: 'Prices' },
          { to: '/guides', icon: 'bi-book', label: 'Guides' },
          ...(user?.role === 'FARMER'
            ? [{ to: '/farms', icon: 'bi-house-door', label: 'Farms' }]
            : []),
        ]}
      />
      <div className="container py-4">
        <Outlet />
      </div>
      <Footer />
    </>
  )
}

function MarketsLayout() {
  const { user } = useAuth()

  return (
    <>
      <AuthenticatedNav
        links={[
          { to: '/markets/prices', icon: 'bi-graph-up', label: 'Market Prices' },
          { to: '/marketplace', icon: 'bi-basket', label: 'Marketplace' },
          { to: '/guides', icon: 'bi-book', label: 'Guides' },
          ...(user?.role === 'FARMER'
            ? [{ to: '/farms', icon: 'bi-house-door', label: 'Farms' }]
            : []),
        ]}
      />
      <div className="container py-4">
        <Outlet />
      </div>
      <Footer />
    </>
  )
}

function GuidesLayout() {
  const { user } = useAuth()

  return (
    <>
      <AuthenticatedNav
        links={[
          { to: '/guides', icon: 'bi-book', label: 'Guides' },
          { to: '/marketplace', icon: 'bi-basket', label: 'Marketplace' },
          { to: '/markets/prices', icon: 'bi-graph-up', label: 'Market Prices' },
          ...(user?.role === 'FARMER'
            ? [{ to: '/farms', icon: 'bi-house-door', label: 'Farms' }]
            : []),
        ]}
      />
      <div className="container py-4">
        <Outlet />
      </div>
      <Footer />
    </>
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
          <Route path="/markets/prices" element={<MarketsLayout />}>
            <Route index element={<MarketPricesPage />} />
          </Route>
          <Route path="/guides" element={<GuidesLayout />}>
            <Route index element={<GuidesListPage />} />
            <Route path=":articleId" element={<ArticlePage />} />
          </Route>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App