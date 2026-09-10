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
      <div>
        <Link to="/crops">← Back to crops</Link>
        <h1 className="page-title">{cropLabel || `Crop #${cropId}`}</h1>
        <p className="page-subtitle">Record farming activities for this crop.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        <h2>{editingId ? 'Edit Activity' : 'Record an Activity'}</h2>
        <form onSubmit={onSubmit} className="form-grid">
          <label className="form-field">
            Activity type
            <select value={form.activity_type} onChange={set('activity_type')}>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Date
            <input type="date" value={form.date} onChange={set('date')} required />
          </label>
          <label className="form-field full">
            Description
            <input value={form.description} onChange={set('description')} placeholder="e.g. Second weeding round" />
          </label>
          <label className="form-field">
            Cost (UGX)
            <input type="number" step="0.01" min="0" value={form.cost} onChange={set('cost')} placeholder="e.g. 15000" />
          </label>
          <label className="form-field full">
            Notes
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add activity'}
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
        <h2>All Activities</h2>
        {activities.length === 0 ? (
          <div className="empty">No activities yet. Record the first activity above.</div>
        ) : (
          <div className="list">
            {activities.map((activity) => (
              <div key={activity.id} className="list-item">
                <div>
                  <h3>{activity.activity_type_display}</h3>
                  <p>
                    {activity.date}
                    {activity.description ? ` · ${activity.description}` : ''}
                    {Number(activity.cost) > 0 ? ` · ${formatCost(activity.cost)}` : ''}
                  </p>
                </div>
                <div className="item-actions">
                  <button type="button" className="btn-ghost btn-sm" onClick={() => onEdit(activity)}>
                    Edit
                  </button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => void onDelete(activity.id)}>
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