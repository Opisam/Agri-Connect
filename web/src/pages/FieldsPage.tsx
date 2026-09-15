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
      <div>
        <Link to="/farms">← Back to farms</Link>
        <h1 className="page-title">{farmName || `Farm #${farmId}`}</h1>
        <p className="page-subtitle">Manage the fields on this farm.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        <h2>{editingId ? 'Edit Field' : 'Add a Field'}</h2>
        <form onSubmit={onSubmit} className="form-grid">
          <label className="form-field">
            Field name
            <input value={form.name} onChange={set('name')} required placeholder="e.g. Field A" />
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
              placeholder="e.g. 4"
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
          <label className="form-field">
            Description
            <input value={form.description} onChange={set('description')} placeholder="Optional" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add field'}
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
        <h2>All Fields</h2>
        {fields.length === 0 ? (
          <div className="empty">No fields yet. Add your first field above.</div>
        ) : (
          <div className="list">
            {fields.map((field) => (
              <div key={field.id} className="list-item">
                <div>
                  <h3>{field.name}</h3>
                  <p>
                    {field.size} {field.size_unit}
                    {field.description ? ` · ${field.description}` : ''}
                  </p>
                </div>
                <div className="item-actions">
                  <button type="button" className="btn-ghost btn-sm" onClick={() => onEdit(field)}>
                    Edit
                  </button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => void onDelete(field.id)}>
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