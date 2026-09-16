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
      <div className="agri-page-header">
        <h1><i className="bi bi-flower1 me-2 text-success" />My Crops</h1>
        <p>Track what is growing on your fields.</p>
      </div>

      {error && <div className="alert alert-agri-error">{error}</div>}

      <div className="agri-card card agri-section">
        <div className="card-header">
          <i className="bi bi-plus-circle me-1 text-success" />
          {editingId ? 'Edit Crop' : 'Record a Crop'}
        </div>
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-12">
                <label className="form-label">Field</label>
                <select className="form-select" value={form.field_id} onChange={set('field_id')}>
                  <option value={0}>Choose a field…</option>
                  {options.map((o) => (
                    <option key={o.fieldId} value={o.fieldId}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Crop type</label>
                <select className="form-select" value={form.crop_type} onChange={set('crop_type')}>
                  {CROP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Variety</label>
                <input
                  className="form-control"
                  value={form.variety}
                  onChange={set('variety')}
                  placeholder="e.g. Longe 5"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Planting date</label>
                <input type="date" className="form-control" value={form.planting_date ?? ''} onChange={set('planting_date')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Expected harvest date</label>
                <input type="date" className="form-control" value={form.expected_harvest_date ?? ''} onChange={set('expected_harvest_date')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={set('status')}>
                  {CROP_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Notes</label>
                <input
                  className="form-control"
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn-agri" disabled={busy}>
                <i className="bi bi-check-lg me-1" />
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add crop'}
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
          <i className="bi bi-list-ul me-1 text-success" />All Crops ({crops.length})
        </div>
        <div className="card-body">
          {crops.length === 0 ? (
            <div className="agri-empty">
              <i className="bi bi-flower1" />
              No crops yet. Record your first crop above.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {crops.map((crop) => (
                <div key={crop.id} className="agri-list-item">
                  <div>
                    <h5>
                      <i className="bi bi-flower1 me-1 text-success" />
                      {crop.crop_type_display}{crop.variety ? ` — ${crop.variety}` : ''}
                      <span className={`badge badge-${crop.status.toLowerCase()} ms-2`}>{crop.status_display}</span>
                    </h5>
                    <p>
                      {crop.field_name} · {crop.farm_name}
                      {crop.planting_date ? ` · Planted ${crop.planting_date}` : ''}
                    </p>
                  </div>
                  <div className="list-actions">
                    <Link to={`/crops/${crop.id}/activities`} className="btn-agri-outline btn-sm">
                      <i className="bi bi-clipboard-check me-1" />Activities
                    </Link>
                    <button type="button" className="btn-agri-outline btn-sm" onClick={() => onEdit(crop)}>
                      <i className="bi bi-pencil me-1" />Edit
                    </button>
                    <button type="button" className="btn-agri-danger btn-sm" onClick={() => void onDelete(crop.id)}>
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