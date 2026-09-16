import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import { fieldsApi, farmsApi } from '../farms/api'
import { SIZE_UNITS, type Field, type FieldPayload } from '../farms/types'

const EMPTY_FORM: FieldPayload = {
  name: '',
  size: '',
  size_unit: 'acres',
  description: '',
}

export function FieldsPage() {
  const { farmId } = useParams<{ farmId: string }>()
  const farmIdNumber = Number(farmId)
  const [farmName, setFarmName] = useState('')
  const [fields, setFields] = useState<Field[]>([])
  const [form, setForm] = useState<FieldPayload>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!Number.isInteger(farmIdNumber)) return
    const load = async () => {
      try {
        const [page, farm] = await Promise.all([
          fieldsApi.list(farmIdNumber),
          farmsApi.list(),
        ])
        setFields(page.results)
        setFarmName(farm.results.find((f) => f.id === farmIdNumber)?.name ?? '')
      } catch (err) {
        setError(getApiErrorMessage(err))
      }
    }
    void load()
  }, [farmIdNumber])

  const set = (key: keyof FieldPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (editingId) {
        await fieldsApi.update(editingId, form)
      } else {
        await fieldsApi.create(farmIdNumber, form)
      }
      setForm(EMPTY_FORM)
      setEditingId(null)
      const page = await fieldsApi.list(farmIdNumber)
      setFields(page.results)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onEdit = (field: Field) => {
    setEditingId(field.id)
    setForm({
      name: field.name,
      size: field.size,
      size_unit: field.size_unit,
      description: field.description,
    })
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this field?')) return
    setError(null)
    try {
      await fieldsApi.remove(id)
      const page = await fieldsApi.list(farmIdNumber)
      setFields(page.results)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="content">
      <div className="agri-page-header">
        <Link to="/farms" className="text-decoration-none">
          <i className="bi bi-arrow-left me-1" />Back to farms
        </Link>
        <h1 className="mt-2">
          <i className="bi bi-grid me-2 text-success" />
          {farmName || `Farm #${farmId}`}
        </h1>
        <p>Manage the fields on this farm.</p>
      </div>

      {error && <div className="alert alert-agri-error">{error}</div>}

      <div className="agri-card card agri-section">
        <div className="card-header">
          <i className="bi bi-plus-circle me-1 text-success" />
          {editingId ? 'Edit Field' : 'Add a Field'}
        </div>
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Field name</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={set('name')}
                  required
                  placeholder="e.g. Field A"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Size</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={form.size}
                  onChange={set('size')}
                  required
                  placeholder="e.g. 4"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Size unit</label>
                <select className="form-select" value={form.size_unit} onChange={set('size_unit')}>
                  {SIZE_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn-agri" disabled={busy}>
                <i className="bi bi-check-lg me-1" />
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add field'}
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
          <i className="bi bi-list-ul me-1 text-success" />All Fields ({fields.length})
        </div>
        <div className="card-body">
          {fields.length === 0 ? (
            <div className="agri-empty">
              <i className="bi bi-bounding-box" />
              No fields yet. Add your first field above.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {fields.map((field) => (
                <div key={field.id} className="agri-list-item">
                  <div>
                    <h5>
                      <i className="bi bi-bounding-box me-1 text-success" />
                      {field.name}
                    </h5>
                    <p>
                      {field.size} {field.size_unit}
                      {field.description ? ` · ${field.description}` : ''}
                    </p>
                  </div>
                  <div className="list-actions">
                    <button type="button" className="btn-agri-outline btn-sm" onClick={() => onEdit(field)}>
                      <i className="bi bi-pencil me-1" />Edit
                    </button>
                    <button type="button" className="btn-agri-danger btn-sm" onClick={() => void onDelete(field.id)}>
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