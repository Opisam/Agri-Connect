import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

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
      <div className="agri-page-header">
        <h1><i className="bi bi-bar-chart-line me-2 text-success" />Farm Finances</h1>
        <p>Understand your expenses, revenue and profit.</p>
      </div>

      <div className="agri-quick-nav">
        <Link to="/finance" className="btn btn-agri">
          <i className="bi bi-graph-up me-1" />Dashboard
        </Link>
        <Link to="/finance/expenses" className="btn btn-agri-outline">
          <i className="bi bi-receipt me-1" />Expenses
        </Link>
        <Link to="/finance/harvests" className="btn btn-agri-outline">
          <i className="bi bi-box-seam me-1" />Harvests
        </Link>
        <Link to="/finance/sales" className="btn btn-agri-outline">
          <i className="bi bi-tag me-1" />Sales
        </Link>
      </div>

      {error && <div className="alert alert-agri-error">{error}</div>}

      <div className="agri-card card agri-section">
        <div className="card-header">
          <i className="bi bi-funnel me-1 text-success" />Filter Results
        </div>
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Farm</label>
                <select className="form-select" value={filters.farm_id} onChange={set('farm_id')}>
                  <option value="">All farms</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Crop</label>
                <select className="form-select" value={filters.crop_id} onChange={set('crop_id')}>
                  <option value="">All crops</option>
                  {farmCrops.map((crop) => (
                    <option key={crop.id} value={crop.id}>{crop.crop_type_display}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">From</label>
                <input type="date" className="form-control" value={filters.start_date} onChange={set('start_date')} />
              </div>
              <div className="col-md-2">
                <label className="form-label">To</label>
                <input type="date" className="form-control" value={filters.end_date} onChange={set('end_date')} />
              </div>
              <div className="col-md-2 d-flex align-items-end gap-2">
                <button type="submit" className="btn-agri w-100" disabled={busy}>
                  <i className="bi bi-search me-1" />
                  {busy ? 'Calculating…' : 'Calculate'}
                </button>
                <button
                  type="button"
                  className="btn-agri-outline"
                  onClick={() => {
                    setFilters(EMPTY_FILTERS)
                    void loadSummary(EMPTY_FILTERS)
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {summary && (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="agri-stat-card">
              <div className="stat-icon red mb-2"><i className="bi bi-receipt" /></div>
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value">UGX {totalExpenses.toLocaleString()}</div>
              <div className="stat-meta">{summary.expense_count} expense record{summary.expense_count === 1 ? '' : 's'}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="agri-stat-card">
              <div className="stat-icon green mb-2"><i className="bi bi-cash-coin" /></div>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">UGX {totalRevenue.toLocaleString()}</div>
              <div className="stat-meta">{summary.sale_count} sale record{summary.sale_count === 1 ? '' : 's'}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className={`agri-stat-card ${profitLoss >= 0 ? '' : 'border border-danger'}`}>
              <div className={`stat-icon ${profitLoss >= 0 ? 'orange' : 'red'} mb-2`}>
                <i className={`bi ${profitLoss >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'}`} />
              </div>
              <div className="stat-label">{profitLoss >= 0 ? 'Profit' : 'Loss'}</div>
              <div className={`stat-value ${profitLoss >= 0 ? '' : 'text-danger'}`}>
                UGX {Math.abs(profitLoss).toLocaleString()}
              </div>
              <div className="stat-meta">
                {profitLoss >= 0 ? 'Revenue minus expenses' : 'Expenses exceed revenue'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}