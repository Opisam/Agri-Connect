import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import { activitiesApi, cropsApi } from '../farms/api'
import { ACTIVITY_TYPES, type CropActivity, type CropActivityPayload } from '../farms/types'

const EMPTY_FORM: CropActivityPayload = {
  activity_type: 'land_preparation',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  cost: '0',
  notes: '',
}

export function ActivitiesPage() {
  const { cropId } = useParams<{ cropId: string }>()
  const cropIdNumber = Number(cropId)
  const [cropLabel, setCropLabel] = useState('')
  const [activities, setActivities] = useState<CropActivity[]>([])
  const [form, setForm] = useState<CropActivityPayload>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!Number.isInteger(cropIdNumber)) return
    const load = async () => {
      try {
        const [page, cropPage] = await Promise.all([
          activitiesApi.list(cropIdNumber),
          cropsApi.list(),
        ])
        setActivities(page.results)
        const crop = cropPage.results.find((c) => c.id === cropIdNumber)
        if (crop) {
          setCropLabel(`${crop.crop_type_display} — ${crop.field_name}`)
        }
      } catch (err) {
        setError(getApiErrorMessage(err))
      }
    }
    void load()
  }, [cropIdNumber])

  const set = (key: keyof CropActivityPayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (editingId) {
        await activitiesApi.update(editingId, form)
      } else {
        await activitiesApi.create(cropIdNumber, form)
      }
      setForm(EMPTY_FORM)
      setEditingId(null)
      const page = await activitiesApi.list(cropIdNumber)
      setActivities(page.results)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onEdit = (activity: CropActivity) => {
    setEditingId(activity.id)
    setForm({
      activity_type: activity.activity_type,
      date: activity.date,
      description: activity.description,
      cost: activity.cost,
      notes: activity.notes,
    })
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this activity record?')) return
    setError(null)
    try {
      await activitiesApi.remove(id)
      const page = await activitiesApi.list(cropIdNumber)
      setActivities(page.results)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const formatCost = (cost: string) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(Number(cost))

  return (
    <div className="content">
      <div className="agri-page-header">
        <Link to="/crops" className="text-decoration-none">
          <i className="bi bi-arrow-left me-1" />Back to crops
        </Link>
        <h1 className="mt-2">
          <i className="bi bi-clipboard-check me-2 text-success" />
          {cropLabel || `Crop #${cropId}`}
        </h1>
        <p>Record farming activities for this crop.</p>
      </div>

      {error && <div className="alert alert-agri-error">{error}</div>}

      <div className="agri-card card agri-section">
        <div className="card-header">
          <i className="bi bi-plus-circle me-1 text-success" />
          {editingId ? 'Edit Activity' : 'Record an Activity'}
        </div>
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Activity type</label>
                <select className="form-select" value={form.activity_type} onChange={set('activity_type')}>
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={form.date} onChange={set('date')} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Cost (UGX)</label>
                <input type="number" step="0.01" min="0" className="form-control" value={form.cost} onChange={set('cost')} placeholder="e.g. 15000" />
              </div>
              <div className="col-md-12">
                <label className="form-label">Description</label>
                <input className="form-control" value={form.description} onChange={set('description')} placeholder="e.g. Second weeding round" />
              </div>
              <div className="col-md-12">
                <label className="form-label">Notes</label>
                <textarea className="form-control" value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional" />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn-agri" disabled={busy}>
                <i className="bi bi-check-lg me-1" />
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add activity'}
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
          <i className="bi bi-list-ul me-1 text-success" />All Activities ({activities.length})
        </div>
        <div className="card-body">
          {activities.length === 0 ? (
            <div className="agri-empty">
              <i className="bi bi-clipboard" />
              No activities yet. Record the first activity above.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {activities.map((activity) => (
                <div key={activity.id} className="agri-list-item">
                  <div>
                    <h5>
                      <i className="bi bi-clipboard-check me-1 text-success" />
                      {activity.activity_type_display}
                    </h5>
                    <p>
                      {activity.date}
                      {activity.description ? ` · ${activity.description}` : ''}
                      {Number(activity.cost) > 0 ? ` · ${formatCost(activity.cost)}` : ''}
                    </p>
                  </div>
                  <div className="list-actions">
                    <button type="button" className="btn-agri-outline btn-sm" onClick={() => onEdit(activity)}>
                      <i className="bi bi-pencil me-1" />Edit
                    </button>
                    <button type="button" className="btn-agri-danger btn-sm" onClick={() => void onDelete(activity.id)}>
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