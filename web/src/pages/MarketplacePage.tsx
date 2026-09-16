import { useEffect, useState } from 'react'

import { getApiErrorMessage } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { categoriesApi, listingsApi, ordersApi } from '../marketplace/api'
import type { Listing, ProduceCategory } from '../marketplace/types'

export function MarketplacePage() {
  const { user } = useAuth()
  const isBuyer = user?.role === 'BUYER'

  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<ProduceCategory[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // order form state
  const [orderingId, setOrderingId] = useState<number | null>(null)
  const [orderQty, setOrderQty] = useState('')
  const [orderNotes, setOrderNotes] = useState('')

  const load = async () => {
    try {
      const [listingPage, categoryPage] = await Promise.all([
        listingsApi.list(),
        categoriesApi.list(),
      ])
      setListings(listingPage.results)
      setCategories(categoryPage.results)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = listings.filter((l) => {
    const matchSearch =
      !search ||
      l.product_name.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase()) ||
      l.district.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || l.category === Number(categoryFilter)
    return matchSearch && matchCategory
  })

  const onOrder = async (listingId: number) => {
    if (!orderQty || Number(orderQty) <= 0) {
      setError('Enter a valid quantity to order.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await ordersApi.create({
        listing: listingId,
        quantity: orderQty,
        notes: orderNotes,
      })
      setOrderingId(null)
      setOrderQty('')
      setOrderNotes('')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="content">
      <div className="agri-page-header">
        <h1><i className="bi bi-basket me-2 text-success" />Browse Produce</h1>
        <p>Find fresh produce from local farmers.</p>
      </div>

      {error && <div className="alert alert-agri-error">{error}</div>}

      <div className="agri-filter-bar">
        <form
          className="row g-2"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-search text-muted" /></span>
              <input
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Product, location or district"
              />
            </div>
          </div>
          <div className="col-md-4">
            <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="agri-empty">
            <i className="bi bi-basket2" />
            No active listings match your search.
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map((listing) => (
              <div key={listing.id} className="col-md-6 col-lg-4">
                <div className="agri-card card h-100">
                  <div className="card-body d-flex flex-column">
                    <h5 className="fw-bold mb-2">
                      <i className="bi bi-box-seam me-1 text-success" />
                      {listing.product_name}
                      <span className="badge badge-agri ms-2">{listing.category_name}</span>
                    </h5>
                    <p className="mb-2" style={{ color: '#1b5e20', fontWeight: 700, fontSize: '1.1rem' }}>
                      UGX {Number(listing.price_per_unit).toLocaleString()}<span className="text-muted fs-6 fw-normal"> / {listing.unit}</span>
                    </p>
                    <p className="text-muted mb-1">
                      <i className="bi bi-box me-1" />
                      {listing.quantity_remaining} {listing.unit} available
                    </p>
                    <p className="text-muted mb-1">
                      <i className="bi bi-geo-alt me-1" />
                      {listing.location}, {listing.district}
                    </p>
                    {listing.description && <p className="mb-1">{listing.description}</p>}
                    <p className="text-muted small mb-3">
                      <i className="bi bi-person me-1" />Listed by {listing.farmer_name} ·{' '}
                      <i className="bi bi-calendar-event me-1" />from {listing.available_from}
                    </p>
                    {isBuyer && (
                      <div className="mt-auto">
                        {orderingId === listing.id ? (
                          <form
                            className="d-flex flex-column gap-2"
                            onSubmit={(e) => {
                              e.preventDefault()
                              void onOrder(listing.id)
                            }}
                          >
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={listing.quantity_remaining}
                              className="form-control"
                              value={orderQty}
                              onChange={(e) => setOrderQty(e.target.value)}
                              placeholder={`Max ${listing.quantity_remaining}`}
                              required
                            />
                            <input
                              className="form-control"
                              value={orderNotes}
                              onChange={(e) => setOrderNotes(e.target.value)}
                              placeholder="Notes (optional)"
                            />
                            <div className="d-flex gap-2">
                              <button type="submit" className="btn-agri btn-sm flex-grow-1" disabled={busy}>
                                <i className="bi bi-check-lg me-1" />{busy ? 'Placing…' : 'Confirm'}
                              </button>
                              <button
                                type="button"
                                className="btn-agri-outline btn-sm"
                                onClick={() => {
                                  setOrderingId(null)
                                  setOrderQty('')
                                  setOrderNotes('')
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            className="btn-agri w-100"
                            onClick={() => setOrderingId(listing.id)}
                          >
                            <i className="bi bi-cart-plus me-1" />Order
                          </button>
                        )}
                      </div>
                    )}
                    {!isBuyer && (
                      <div className="mt-auto small text-muted">
                        <i className="bi bi-info-circle me-1" />Log in as a buyer to place an order.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}