import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import { cropsApi, fieldsApi, farmsApi } from '../farms/api'
import { CROP_STATUSES, CROP_TYPES, type Crop, type CropPayload } from '../farms/types'

const EMPTY_FORM: CropPayload = {
  field_id: 0,
  crop_type: 'maize',
  variety: '',
  planting_date: null,
  expected_harvest_date: null,
  status: 'PLANNED',
  notes: '',
}

export function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [options, setOptions] = useState<{ fieldId: number; label: string }[]>([])
  const [form, setForm] = useState<CropPayload>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [cropPage, farmPage] = await Promise.all([cropsApi.list(), farmsApi.list()])
      setCrops(cropPage.results)
      const allFields: { fieldId: number; label: string }[] = []
      for (const farm of farmPage.results) {
        const fieldPage = await fieldsApi.list(farm.id)
        fieldPage.results.forEach((f) =>
          allFields.push({ fieldId: f.id, label: `${f.name} · ${farm.name}` }),
        )
      }
      setOptions(allFields)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (key: keyof CropPayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.field_id) {
      setError('Please choose the field where this crop is planted.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload: CropPayload = {
        ...form,
        planting_date: form.planting_date || null,
        expected_harvest_date: form.expected_harvest_date || null,
      }
      if (editingId) {
        const { field_id: _skip, ...patch } = payload
        await cropsApi.update(editingId, patch)
      } else {
        await cropsApi.create(payload)
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

  const onEdit = (crop: Crop) => {
    setEditingId(crop.id)
    setForm({
      field_id: crop.field_id,
      crop_type: crop.crop_type,
      variety: crop.variety,
      planting_date: crop.planting_date,
      expected_harvest_date: crop.expected_harvest_date,
      status: crop.status,
      notes: crop.notes,
    })
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this crop record?')) return
    setError(null)
    try {
      await cropsApi.remove(id)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="content">
      <div>
        <h1 className="page-title">My Crops</h1>
        <p className="page-subtitle">Track what is growing on your fields.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        <h2>{editingId ? 'Edit Crop' : 'Record a Crop'}</h2>
        <form onSubmit={onSubmit} className="form-grid">
          <label className="form-field full">
            Field
            <select value={form.field_id} onChange={set('field_id')}>
              <option value={0}>Choose a field…</option>
              {options.map((o) => (
                <option key={o.fieldId} value={o.fieldId}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Crop type
            <select value={form.crop_type} onChange={set('crop_type')}>
              {CROP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Variety
            <input value={form.variety} onChange={set('variety')} placeholder="e.g. Longe 5" />
          </label>
          <label className="form-field">
            Planting date
            <input type="date" value={form.planting_date ?? ''} onChange={set('planting_date')} />
          </label>
          <label className="form-field">
            Expected harvest date
            <input type="date" value={form.expected_harvest_date ?? ''} onChange={set('expected_harvest_date')} />
          </label>
          <label className="form-field">
            Status
            <select value={form.status} onChange={set('status')}>
              {CROP_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="form-field full">
            Notes
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add crop'}
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
        <h2>All Crops</h2>
        {crops.length === 0 ? (
          <div className="empty">No crops yet. Record your first crop above.</div>
        ) : (
          <div className="list">
            {crops.map((crop) => (
              <div key={crop.id} className="list-item">
                <div>
                  <h3>{crop.crop_type_display}{crop.variety ? ` — ${crop.variety}` : ''}</h3>
                  <p>
                    {crop.field_name} · {crop.farm_name} · <span className="badge">{crop.status_display}</span>
                  </p>
                  {crop.planting_date && (
                    <p className="text-muted">Planted {crop.planting_date}</p>
                  )}
                </div>
                <div className="item-actions">
                  <Link to={`/crops/${crop.id}/activities`} className="btn-ghost btn-sm">
                    Activities
                  </Link>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => onEdit(crop)}>
                    Edit
                  </button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => void onDelete(crop.id)}>
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