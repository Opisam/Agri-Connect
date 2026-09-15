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
      <div>
        <h1 className="page-title">Browse Produce</h1>
        <p className="page-subtitle">Find fresh produce from local farmers.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label className="form-field">
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product, location or district"
            />
          </label>
          <label className="form-field">
            Category
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </form>
      </section>

      <section className="section">
        {filtered.length === 0 ? (
          <div className="empty">No active listings match your search.</div>
        ) : (
          <div className="list">
            {filtered.map((listing) => (
              <div key={listing.id} className="list-item">
                <div>
                  <h3>
                    {listing.product_name}
                    <span className="badge" style={{ marginLeft: '0.5rem' }}>
                      {listing.category_name}
                    </span>
                  </h3>
                  <p>
                    UGX {Number(listing.price_per_unit).toLocaleString()} / {listing.unit}
                    {' · '}
                    {listing.quantity_remaining} {listing.unit} available
                    {' · '}
                    {listing.location}, {listing.district}
                  </p>
                  {listing.description && <p>{listing.description}</p>}
                  <p className="text-muted">
                    Listed by {listing.farmer_name} · available from {listing.available_from}
                  </p>
                </div>
                {isBuyer && (
                  <div className="item-actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    {orderingId === listing.id ? (
                      <form
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}
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
                          value={orderQty}
                          onChange={(e) => setOrderQty(e.target.value)}
                          placeholder={`Max ${listing.quantity_remaining}`}
                          style={{ width: '120px' }}
                          required
                        />
                        <input
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="Notes (optional)"
                          style={{ width: '200px' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="submit" className="btn-primary btn-sm" disabled={busy}>
                            {busy ? 'Placing…' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
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
                        className="btn-primary btn-sm"
                        onClick={() => setOrderingId(listing.id)}
                      >
                        Order
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
