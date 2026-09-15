import { useEffect, useState } from 'react'

import { getApiErrorMessage } from '../api/client'
import { cropsApi, farmsApi } from '../farms/api'
import type { Crop, Farm } from '../farms/types'
import { salesApi } from '../finance/api'
import type { Sale, SalePayload } from '../finance/types'

const EMPTY_FORM: SalePayload = {
  farm: 0,
  crop: 0,
  quantity: '',
  unit: 'kg',
  unit_price: '',
  buyer_name: '',
  buyer_contact: '',
  sale_date: '',
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

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [form, setForm] = useState<SalePayload>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [salePage, farmPage, cropPage] = await Promise.all([
        salesApi.list(),
        farmsApi.list(),
        cropsApi.list(),
      ])
      setSales(salePage.results)
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

  const set = (key: keyof SalePayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.farm) {
      setError('Please choose the farm for this sale.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload: SalePayload = {
        ...form,
        farm: Number(form.farm),
        crop: form.crop ? Number(form.crop) : null,
      }
      if (editingId) {
        await salesApi.update(editingId, payload)
      } else {
        await salesApi.create(payload)
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

  const onEdit = (sale: Sale) => {
    setEditingId(sale.id)
    setForm({
      farm: sale.farm,
      crop: sale.crop ?? 0,
      quantity: sale.quantity,
      unit: sale.unit,
      unit_price: sale.unit_price,
      buyer_name: sale.buyer_name,
      buyer_contact: sale.buyer_contact,
      sale_date: sale.sale_date,
      notes: sale.notes,
    })
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this sale record?')) return
    setError(null)
    try {
      await salesApi.remove(id)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const farmCrops = crops.filter((c) => c.farm === form.farm)

  return (
    <div className="content">
      <div>
        <h1 className="page-title">Sales</h1>
        <p className="page-subtitle">Record the produce you have sold.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        <h2>{editingId ? 'Edit Sale' : 'Record a Sale'}</h2>
        <form onSubmit={onSubmit} className="form-grid">
          <label className="form-field">
            Farm
            <select value={form.farm} onChange={set('farm')}>
              <option value={0}>Choose a farm…</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Crop (optional)
            <select value={form.crop ?? 0} onChange={set('crop')}>
              <option value={0}>No specific crop</option>
              {farmCrops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.crop_type_display}{crop.variety ? ` — ${crop.variety}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Quantity
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.quantity}
              onChange={set('quantity')}
              required
              placeholder="e.g. 500"
            />
          </label>
          <label className="form-field">
            Unit
            <select value={form.unit} onChange={set('unit')}>
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Unit price (UGX)
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.unit_price}
              onChange={set('unit_price')}
              required
              placeholder="e.g. 1400"
            />
          </label>
          <label className="form-field">
            Sale date
            <input type="date" value={form.sale_date} onChange={set('sale_date')} required />
          </label>
          <label className="form-field">
            Buyer name (optional)
            <input value={form.buyer_name} onChange={set('buyer_name')} placeholder="e.g. Lira Market Agent" />
          </label>
          <label className="form-field">
            Buyer contact (optional)
            <input value={form.buyer_contact} onChange={set('buyer_contact')} placeholder="e.g. +256701234567" />
          </label>
          <label className="form-field full">
            Notes
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add sale'}
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
        <h2>All Sales</h2>
        {sales.length === 0 ? (
          <div className="empty">No sales yet. Record your first sale above.</div>
        ) : (
          <div className="list">
            {sales.map((sale) => (
              <div key={sale.id} className="list-item">
                <div>
                  <h3>UGX {Number(sale.total_amount).toLocaleString()}</h3>
                  <p>
                    {Number(sale.quantity).toLocaleString()} {sale.unit} × UGX {Number(sale.unit_price).toLocaleString()}
                    {sale.crop_name ? ` · ${sale.crop_name}` : ''} · {sale.farm_name} · {sale.sale_date}
                  </p>
                  {sale.buyer_name && <p className="text-muted">Buyer: {sale.buyer_name}</p>}
                </div>
                <div className="item-actions">
                  <button type="button" className="btn-ghost btn-sm" onClick={() => onEdit(sale)}>
                    Edit
                  </button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => void onDelete(sale.id)}>
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