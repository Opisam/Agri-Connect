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
      <div>
        <h1 className="page-title">Expenses</h1>
        <p className="page-subtitle">Record the costs of running your farm.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        <h2>{editingId ? 'Edit Expense' : 'Add an Expense'}</h2>
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
            Category
            <select value={form.category} onChange={set('category')}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Amount (UGX)
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={set('amount')}
              required
              placeholder="e.g. 50000"
            />
          </label>
          <label className="form-field">
            Date
            <input type="date" value={form.date} onChange={set('date')} required />
          </label>
          <label className="form-field">
            Description
            <input value={form.description} onChange={set('description')} placeholder="e.g. Maize seeds" />
          </label>
          <label className="form-field full">
            Notes
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional" />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add expense'}
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
        <h2>All Expenses</h2>
        {expenses.length === 0 ? (
          <div className="empty">No expenses yet. Add your first expense above.</div>
        ) : (
          <div className="list">
            {expenses.map((expense) => (
              <div key={expense.id} className="list-item">
                <div>
                  <h3>{expense.category_display} — UGX {Number(expense.amount).toLocaleString()}</h3>
                  <p>
                    {expense.farm_name}
                    {expense.crop_name ? ` · ${expense.crop_name}` : ''} · {expense.date}
                    {expense.description ? ` · ${expense.description}` : ''}
                  </p>
                </div>
                <div className="item-actions">
                  <button type="button" className="btn-ghost btn-sm" onClick={() => onEdit(expense)}>
                    Edit
                  </button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => void onDelete(expense.id)}>
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