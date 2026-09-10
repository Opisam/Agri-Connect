import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import { farmsApi } from '../farms/api'
import { FARM_TYPES, SIZE_UNITS, type Farm, type FarmPayload } from '../farms/types'

const EMPTY_FORM: FarmPayload = {
  name: '',
  location: '',
  district: '',
  subcounty: '',
  size: '',
  size_unit: 'acres',
  farm_type: 'crop_farming',
  description: '',
}

export function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [form, setForm] = useState<FarmPayload>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const page = await farmsApi.list()
      setFarms(page.results)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    void farmsApi
      .list()
      .then((page) => setFarms(page.results))
      .catch((err) => setError(getApiErrorMessage(err)))
  }, [])

  const set = (key: keyof FarmPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (editingId) {
        await farmsApi.update(editingId, form)
      } else {
        await farmsApi.create(form)
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

  const onEdit = (farm: Farm) => {
    setEditingId(farm.id)
    setForm({
      name: farm.name,
      location: farm.location,
      district: farm.district,
      subcounty: farm.subcounty,
      size: farm.size,
      size_unit: farm.size_unit,
      farm_type: farm.farm_type,
      description: farm.description,
    })
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this farm? This cannot be undone.')) return
    setError(null)
    try {
      await farmsApi.remove(id)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="content">
      <div>
        <h1 className="page-title">My Farms</h1>
        <p className="page-subtitle">Create and manage the farms you own.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        <h2>{editingId ? 'Edit Farm' : 'Add a Farm'}</h2>
        <form onSubmit={onSubmit} className="form-grid">
          <label className="form-field">
            Farm name
            <input value={form.name} onChange={set('name')} required placeholder="e.g. Okello Family Farm" />
          </label>
          <label className="form-field">
            Location
            <input value={form.location} onChange={set('location')} required placeholder="e.g. Opit, Gulu" />
          </label>
          <label className="form-field">
            District
            <input value={form.district} onChange={set('district')} required placeholder="e.g. Gulu" />
          </label>
          <label className="form-field">
            Subcounty
            <input value={form.subcounty} onChange={set('subcounty')} placeholder="e.g. Paicho" />
          </label>
          <label className="form-field">
            Size
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.size}
              onChange={set('size')}
              required
              placeholder="e.g. 10"
            />
          </label>
          <label className="form-field">
            Size unit
            <select value={form.size_unit} onChange={set('size_unit')}>
              {SIZE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </label>
          <label className="form-field full">
            Farm type
            <select value={form.farm_type} onChange={set('farm_type')}>
              {FARM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="form-field full">
            Description
            <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Optional notes" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add farm'}
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
        <h2>All Farms</h2>
        {farms.length === 0 ? (
          <div className="empty">No farms yet. Add your first farm above.</div>
        ) : (
          <div className="list">
            {farms.map((farm) => (
              <div key={farm.id} className="list-item">
                <div>
                  <h3>{farm.name}</h3>
                  <p>
                    {farm.location}, {farm.district} · {farm.size} {farm.size_unit} · <span className="badge">{farm.farm_type.replace('_', ' ')}</span>
                  </p>
                  <p>
                    {farm.field_count} field{farm.field_count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="item-actions">
                  <Link to={`/farms/${farm.id}/fields`} className="btn-ghost btn-sm">
                    Fields
                  </Link>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => onEdit(farm)}>
                    Edit
                  </button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => void onDelete(farm.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}