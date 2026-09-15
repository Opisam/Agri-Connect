import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { getApiErrorMessage } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { categoriesApi, listingsApi } from '../marketplace/api'
import type { Listing, ListingPayload, ProduceCategory } from '../marketplace/types'

const EMPTY_FORM: ListingPayload = {
  product_name: '',
  category: 0,
  quantity: '',
  unit: 'kg',
  price_per_unit: '',
  location: '',
  district: '',
  available_from: new Date().toISOString().slice(0, 10),
  description: '',
  status: 'ACTIVE',
}

const UNITS = ['kg', 'g', 'lb', 'bunch', 'piece', 'sack', 'crate', 'litre']

export function MyListingsPage() {
  const { user } = useAuth()

  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<ProduceCategory[]>([])
  const [form, setForm] = useState<ListingPayload>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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

  const set = (key: keyof ListingPayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category) {
      setError('Please select a produce category.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload: ListingPayload = {
        ...form,
        category: Number(form.category),
        quantity: String(form.quantity),
        price_per_unit: String(form.price_per_unit),
      }
      if (editingId) {
        await listingsApi.update(editingId, payload)
      } else {
        await listingsApi.create({ ...payload, status: 'ACTIVE' })
      }
      setForm(EMPTY_FORM)
      setEditingId(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onEdit = (listing: Listing) => {
    setEditingId(listing.id)
    setForm({
      product_name: listing.product_name,
      category: listing.category,
      quantity: listing.quantity,
      unit: listing.unit,
      price_per_unit: listing.price_per_unit,
      location: listing.location,
      district: listing.district,
      available_from: listing.available_from,
      description: listing.description,
      status: listing.status,
    })
  }

  const onCancelListing = async (id: number) => {
    if (!window.confirm('Cancel this listing? Buyers will no longer see it.')) return
    setError(null)
    try {
      await listingsApi.update(id, { status: 'CANCELLED' })
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const onResumeListing = async (id: number) => {
    setError(null)
    try {
      const today = new Date().toISOString().slice(0, 10)
      await listingsApi.update(id, { status: 'ACTIVE', available_from: today })
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('Permanently delete this listing?')) return
    setError(null)
    try {
      await listingsApi.remove(id)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  if (user?.role !== 'FARMER') {
    return (
      <div className="content">
        <p>Only farmers can manage listings. <Link to="/marketplace">Browse marketplace</Link></p>
      </div>
    )
  }

  const farmerListings = listings.filter((l) => l.farmer === user.id)

  return (
    <div className="content">
      <div>
        <h1 className="page-title">My Listings</h1>
        <p className="page-subtitle">Manage your produce listings on the marketplace.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        <h2>{editingId ? 'Edit Listing' : 'New Listing'}</h2>
        <form onSubmit={onSubmit} className="form-grid">
          <label className="form-field">
            Product name
            <input value={form.product_name} onChange={set('product_name')} required placeholder="e.g. Fresh tomatoes" />
          </label>
          <label className="form-field">
            Category
            <select value={form.category} onChange={set('category')} required>
              <option value={0}>Choose a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Quantity
            <input type="number" step="0.01" min="0.01" value={form.quantity} onChange={set('quantity')} required />
          </label>
          <label className="form-field">
            Unit
            <select value={form.unit} onChange={set('unit')}>
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Price per unit (UGX)
            <input type="number" step="0.01" min="0.01" value={form.price_per_unit} onChange={set('price_per_unit')} required />
          </label>
          <label className="form-field">
            Location
            <input value={form.location} onChange={set('location')} required placeholder="e.g. Lugazi" />
          </label>
          <label className="form-field">
            District
            <input value={form.district} onChange={set('district')} required placeholder="e.g. Mukono" />
          </label>
          <label className="form-field">
            Available from
            <input type="date" value={form.available_from} onChange={set('available_from')} required />
          </label>
          <label className="form-field full">
            Description
            <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Optional" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create listing'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setEditingId(null)
                  setForm(EMPTY_FORM)
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="section">
        <h2>All My Listings</h2>
        {farmerListings.length === 0 ? (
          <div className="empty">No listings yet. Create your first listing above.</div>
        ) : (
          <div className="list">
            {farmerListings.map((listing) => (
              <div key={listing.id} className="list-item">
                <div>
                  <h3>
                    {listing.product_name}
                    <span className={`badge badge-${listing.status.toLowerCase()}`} style={{ marginLeft: '0.5rem' }}>
                      {listing.status_display}
                    </span>
                  </h3>
                  <p>
                    UGX {Number(listing.price_per_unit).toLocaleString()} / {listing.unit}
                    {' · '}
                    {listing.quantity_remaining} / {listing.quantity} {listing.unit} available
                    {' · '}
                    {listing.location}, {listing.district}
                  </p>
                </div>
                <div className="item-actions">
                  {listing.status !== 'CANCELLED' && (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => onEdit(listing)}>
                      Edit
                    </button>
                  )}
                  {listing.status === 'ACTIVE' && (
                    <button type="button" className="btn-danger btn-sm" onClick={() => void onCancelListing(listing.id)}>
                      Cancel
                    </button>
                  )}
                  {(listing.status === 'CANCELLED' || listing.status === 'EXPIRED') && (
                    <button type="button" className="btn-primary btn-sm" onClick={() => void onResumeListing(listing.id)}>
                      Reactivate
                    </button>
                  )}
                  {(listing.status === 'DRAFT' || listing.status === 'CANCELLED') && (
                    <button type="button" className="btn-danger btn-sm" onClick={() => void onDelete(listing.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
