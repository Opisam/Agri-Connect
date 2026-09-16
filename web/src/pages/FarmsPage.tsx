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
      <div className="agri-page-header">
        <h1><i className="bi bi-house-door me-2 text-success" />My Farms</h1>
        <p>Create and manage the farms you own.</p>
      </div>

      {error && <div className="alert alert-agri-error">{error}</div>}

      <div className="agri-card card agri-section">
        <div className="card-header">
          <i className="bi bi-plus-circle me-1 text-success" />
          {editingId ? 'Edit Farm' : 'Add a Farm'}
        </div>
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Farm name</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={set('name')}
                  required
                  placeholder="e.g. Okello Family Farm"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Location</label>
                <input
                  className="form-control"
                  value={form.location}
                  onChange={set('location')}
                  required
                  placeholder="e.g. Opit, Gulu"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">District</label>
                <input
                  className="form-control"
                  value={form.district}
                  onChange={set('district')}
                  required
                  placeholder="e.g. Gulu"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Subcounty</label>
                <input
                  className="form-control"
                  value={form.subcounty}
                  onChange={set('subcounty')}
                  placeholder="e.g. Paicho"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Size</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={form.size}
                  onChange={set('size')}
                  required
                  placeholder="e.g. 10"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Size unit</label>
                <select className="form-select" value={form.size_unit} onChange={set('size_unit')}>
                  {SIZE_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-12">
                <label className="form-label">Farm type</label>
                <select className="form-select" value={form.farm_type} onChange={set('farm_type')}>
                  {FARM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={form.description}
                  onChange={set('description')}
                  rows={2}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn-agri" disabled={busy}>
                <i className="bi bi-check-lg me-1" />
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add farm'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-agri-outline"
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
        </div>
      </div>

      <div className="agri-card card">
        <div className="card-header">
          <i className="bi bi-list-ul me-1 text-success" />All Farms ({farms.length})
        </div>
        <div className="card-body">
          {farms.length === 0 ? (
            <div className="agri-empty">
              <i className="bi bi-house-x" />
              No farms yet. Add your first farm above.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {farms.map((farm) => (
                <div key={farm.id} className="agri-list-item">
                  <div>
                    <h5>
                      <i className="bi bi-tree me-1 text-success" />
                      {farm.name}
                    </h5>
                    <p className="mb-1">
                      <span className="badge badge-agri">{farm.farm_type.replace('_', ' ')}</span>
                    </p>
                    <p className="mb-0">
                      <i className="bi bi-geo-alt me-1" />
                      {farm.location}, {farm.district} · {farm.size} {farm.size_unit}
                    </p>
                    <p className="mb-0">
                      {`${farm.field_count} field${farm.field_count === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="list-actions">
                    <Link to={`/farms/${farm.id}/fields`} className="btn-agri-outline btn-sm">
                      <i className="bi bi-grid me-1" />Fields
                    </Link>
                    <button type="button" className="btn-agri-outline btn-sm" onClick={() => onEdit(farm)}>
                      <i className="bi bi-pencil me-1" />Edit
                    </button>
                    <button type="button" className="btn-agri-danger btn-sm" onClick={() => void onDelete(farm.id)}>
                      <i className="bi bi-trash me-1" />Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}