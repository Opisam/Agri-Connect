import { useEffect, useState } from 'react'

import { getApiErrorMessage } from '../api/client'
import { cropsApi, farmsApi } from '../farms/api'
import type { Crop, Farm } from '../farms/types'
import { harvestsApi } from '../finance/api'
import type { Harvest, HarvestPayload } from '../finance/types'

const EMPTY_FORM: HarvestPayload = {
  farm: 0,
  crop: 0,
  quantity: '',
  unit: 'kg',
  harvest_date: '',
  notes: '',
}

const UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'tonnes', label: 'Tonnes' },
  { value: 'bags', label: 'Bags' },
  { value: 'bunches', label: 'Bunches' },
  { value: 'litres', label: 'Litres' },
  { value: 'pieces', label: 'Pieces' },
]

export function HarvestsPage() {
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [form, setForm] = useState<HarvestPayload>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [harvestPage, farmPage, cropPage] = await Promise.all([
        harvestsApi.list(),
        farmsApi.list(),
        cropsApi.list(),
      ])
      setHarvests(harvestPage.results)
      setFarms(farmPage.results)
      setCrops(cropPage.results)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (key: keyof HarvestPayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.farm) {
      setError('Please choose the farm for this harvest.')
      return
    }
    if (!form.crop) {
      setError('Please choose the crop that was harvested.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload: HarvestPayload = {
        ...form,
        farm: Number(form.farm),
        crop: Number(form.crop),
      }
      if (editingId) {
        await harvestsApi.update(editingId, payload)
      } else {
        await harvestsApi.create(payload)
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

  const onEdit = (harvest: Harvest) => {
    setEditingId(harvest.id)
    setForm({
      farm: harvest.farm,
      crop: harvest.crop,
      quantity: harvest.quantity,
      unit: harvest.unit,
      harvest_date: harvest.harvest_date,
      notes: harvest.notes,
    })
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this harvest record?')) return
    setError(null)
    try {
      await harvestsApi.remove(id)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const farmCrops = crops.filter((c) => c.farm === form.farm)

  return (
    <div className="content">
      <div className="agri-page-header">
        <h1><i className="bi bi-box-seam me-2 text-success" />Harvests</h1>
        <p>Record the yield from your crops.</p>
      </div>

      {error && <div className="alert alert-agri-error">{error}</div>}

      <div className="agri-card card agri-section">
        <div className="card-header">
          <i className="bi bi-plus-circle me-1 text-success" />
          {editingId ? 'Edit Harvest' : 'Record a Harvest'}
        </div>
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Farm</label>
                <select className="form-select" value={form.farm} onChange={set('farm')}>
                  <option value={0}>Choose a farm…</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Crop</label>
                <select className="form-select" value={form.crop} onChange={set('crop')}>
                  <option value={0}>Choose a crop…</option>
                  {farmCrops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.crop_type_display}{crop.variety ? ` — ${crop.variety}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Quantity</label>
                <input type="number" step="0.01" min="0.01" className="form-control" value={form.quantity} onChange={set('quantity')} required placeholder="e.g. 2500" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Unit</label>
                <select className="form-select" value={form.unit} onChange={set('unit')}>
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Harvest date</label>
                <input type="date" className="form-control" value={form.harvest_date} onChange={set('harvest_date')} required />
              </div>
              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea className="form-control" value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional" />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn-agri" disabled={busy}>
                <i className="bi bi-check-lg me-1" />
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add harvest'}
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
          <i className="bi bi-list-ul me-1 text-success" />All Harvests ({harvests.length})
        </div>
        <div className="card-body">
          {harvests.length === 0 ? (
            <div className="agri-empty">
              <i className="bi bi-box-seam" />
              No harvests yet. Record your first harvest above.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {harvests.map((harvest) => (
                <div key={harvest.id} className="agri-list-item">
                  <div>
                    <h5>
                      <i className="bi bi-box-seam me-1 text-success" />
                      {Number(harvest.quantity).toLocaleString()} {harvest.unit}
                    </h5>
                    <p>
                      {harvest.crop_name} · {harvest.farm_name} · {harvest.harvest_date}
                    </p>
                  </div>
                  <div className="list-actions">
                    <button type="button" className="btn-agri-outline btn-sm" onClick={() => onEdit(harvest)}>
                      <i className="bi bi-pencil me-1" />Edit
                    </button>
                    <button type="button" className="btn-agri-danger btn-sm" onClick={() => void onDelete(harvest.id)}>
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