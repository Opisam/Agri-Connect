import { useEffect, useState } from 'react'

import { getApiErrorMessage } from '../api/client'
import { cropsApi, farmsApi } from '../farms/api'
import type { Crop, Farm } from '../farms/types'
import { expensesApi } from '../finance/api'
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpensePayload,
} from '../finance/types'

const EMPTY_FORM: ExpensePayload = {
  farm: 0,
  crop: 0,
  category: 'Seeds',
  amount: '',
  date: '',
  description: '',
  notes: '',
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [form, setForm] = useState<ExpensePayload>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [expensePage, farmPage, cropPage] = await Promise.all([
        expensesApi.list(),
        farmsApi.list(),
        cropsApi.list(),
      ])
      setExpenses(expensePage.results)
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

  const set = (key: keyof ExpensePayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.farm) {
      setError('Please choose the farm for this expense.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload: ExpensePayload = {
        ...form,
        farm: Number(form.farm),
        crop: form.crop ? Number(form.crop) : null,
      }
      if (editingId) {
        await expensesApi.update(editingId, payload)
      } else {
        await expensesApi.create(payload)
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

  const onEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setForm({
      farm: expense.farm,
      crop: expense.crop ?? 0,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      notes: expense.notes,
    })
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this expense?')) return
    setError(null)
    try {
      await expensesApi.remove(id)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const farmCrops = crops.filter((c) => c.farm === form.farm)

  return (
    <div className="content">
      <div className="agri-page-header">
        <h1><i className="bi bi-receipt me-2 text-success" />Expenses</h1>
        <p>Record the costs of running your farm.</p>
      </div>

      {error && <div className="alert alert-agri-error">{error}</div>}

      <div className="agri-card card agri-section">
        <div className="card-header">
          <i className="bi bi-plus-circle me-1 text-success" />
          {editingId ? 'Edit Expense' : 'Add an Expense'}
        </div>
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Farm</label>
                <select className="form-select" value={form.farm} onChange={set('farm')}>
                  <option value={0}>Choose a farm…</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Crop (optional)</label>
                <select className="form-select" value={form.crop ?? 0} onChange={set('crop')}>
                  <option value={0}>No specific crop</option>
                  {farmCrops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.crop_type_display}{crop.variety ? ` — ${crop.variety}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={set('category')}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Amount (UGX)</label>
                <input type="number" step="0.01" min="0.01" className="form-control" value={form.amount} onChange={set('amount')} required placeholder="e.g. 50000" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={form.date} onChange={set('date')} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Description</label>
                <input className="form-control" value={form.description} onChange={set('description')} placeholder="e.g. Maize seeds" />
              </div>
              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea className="form-control" value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional" />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn-agri" disabled={busy}>
                <i className="bi bi-check-lg me-1" />
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add expense'}
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
          <i className="bi bi-list-ul me-1 text-success" />All Expenses ({expenses.length})
        </div>
        <div className="card-body">
          {expenses.length === 0 ? (
            <div className="agri-empty">
              <i className="bi bi-receipt" />
              No expenses yet. Add your first expense above.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {expenses.map((expense) => (
                <div key={expense.id} className="agri-list-item">
                  <div>
                    <h5>
                      <i className="bi bi-receipt me-1 text-danger" />
                      {expense.category_display} — UGX {Number(expense.amount).toLocaleString()}
                    </h5>
                    <p>
                      {expense.farm_name}
                      {expense.crop_name ? ` · ${expense.crop_name}` : ''} · {expense.date}
                      {expense.description ? ` · ${expense.description}` : ''}
                    </p>
                  </div>
                  <div className="list-actions">
                    <button type="button" className="btn-agri-outline btn-sm" onClick={() => onEdit(expense)}>
                      <i className="bi bi-pencil me-1" />Edit
                    </button>
                    <button type="button" className="btn-agri-danger btn-sm" onClick={() => void onDelete(expense.id)}>
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