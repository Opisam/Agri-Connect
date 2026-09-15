import { useEffect, useState } from 'react'

import { getApiErrorMessage } from '../api/client'
import { cropsApi, farmsApi } from '../farms/api'
import type { Crop, Farm } from '../farms/types'
import { profitLossApi } from '../finance/api'
import type { ProfitLoss, ProfitLossFilters } from '../finance/types'

const EMPTY_FILTERS: ProfitLossFilters = {
  farm_id: '',
  crop_id: '',
  start_date: '',
  end_date: '',
}

export function ProfitLossPage() {
  const [summary, setSummary] = useState<ProfitLoss | null>(null)
  const [farms, setFarms] = useState<Farm[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [filters, setFilters] = useState<ProfitLossFilters>(EMPTY_FILTERS)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadOptions = async () => {
    try {
      const [farmPage, cropPage] = await Promise.all([farmsApi.list(), cropsApi.list()])
      setFarms(farmPage.results)
      setCrops(cropPage.results)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const loadSummary = async (current: ProfitLossFilters) => {
    setBusy(true)
    setError(null)
    try {
      const result = await profitLossApi.get(current)
      setSummary(result)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadOptions()
    void loadSummary(EMPTY_FILTERS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (key: keyof ProfitLossFilters) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setFilters((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void loadSummary(filters)
  }

  const totalExpenses = summary ? Number(summary.total_expenses) : 0
  const totalRevenue = summary ? Number(summary.total_revenue) : 0
  const profitLoss = summary ? Number(summary.profit_loss) : 0
  const farmCrops = crops.filter((c) => c.farm === Number(filters.farm_id))

  return (
    <div className="content">
      <div>
        <h1 className="page-title">Farm Finances</h1>
        <p className="page-subtitle">Understand your expenses, revenue and profit.</p>
      </div>

      <div className="section" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <a href="/finance" className="btn-ghost btn-sm">Dashboard</a>
        <a href="/finance/expenses" className="btn-ghost btn-sm">Expenses</a>
        <a href="/finance/harvests" className="btn-ghost btn-sm">Harvests</a>
        <a href="/finance/sales" className="btn-ghost btn-sm">Sales</a>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        <form onSubmit={onSubmit} className="form-grid">
          <label className="form-field">
            Farm
            <select value={filters.farm_id} onChange={set('farm_id')}>
              <option value="">All farms</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Crop
            <select value={filters.crop_id} onChange={set('crop_id')}>
              <option value="">All crops</option>
              {farmCrops.map((crop) => (
                <option key={crop.id} value={crop.id}>{crop.crop_type_display}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            From
            <input type="date" value={filters.start_date} onChange={set('start_date')} />
          </label>
          <label className="form-field">
            To
            <input type="date" value={filters.end_date} onChange={set('end_date')} />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Calculating…' : 'Calculate'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setFilters(EMPTY_FILTERS)
                void loadSummary(EMPTY_FILTERS)
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      {summary && (
        <section className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value stat-expense">UGX {totalExpenses.toLocaleString()}</span>
            <span className="stat-meta">{summary.expense_count} expense record{summary.expense_count === 1 ? '' : 's'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">UGX {totalRevenue.toLocaleString()}</span>
            <span className="stat-meta">{summary.sale_count} sale record{summary.sale_count === 1 ? '' : 's'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{profitLoss >= 0 ? 'Profit' : 'Loss'}</span>
            <span className={`stat-value ${profitLoss >= 0 ? 'stat-profit' : 'stat-expense'}`}>
              UGX {Math.abs(profitLoss).toLocaleString()}
            </span>
            <span className="stat-meta">
              {profitLoss >= 0 ? 'Revenue minus expenses' : 'Expenses exceed revenue'}
            </span>
          </div>
        </section>
      )}
    </div>
  )
}