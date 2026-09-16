import { useEffect, useState } from 'react'

import { getApiErrorMessage } from '../api/client'
import { marketsApi, pricesApi } from '../markets/api'
import type { Market, MarketPrice } from '../markets/types'

export function MarketPricesPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [search, setSearch] = useState('')
  const [marketFilter, setMarketFilter] = useState('')
  const [error, setError] = useState<string | null>(null)

  // history state: marketId + product currently expanded
  const [historyFor, setHistoryFor] = useState<string | null>(null)
  const [history, setHistory] = useState<MarketPrice[]>([])
  const [historyBusy, setHistoryBusy] = useState(false)

  const load = async () => {
    try {
      const [marketPage, currentPrices] = await Promise.all([
        marketsApi.list(),
        pricesApi.current(),
      ])
      setMarkets(marketPage.results)
      setPrices(currentPrices)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = prices.filter((p) => {
    const matchSearch =
      !search || p.product.toLowerCase().includes(search.toLowerCase())
    const matchMarket = !marketFilter || p.market === Number(marketFilter)
    return matchSearch && matchMarket
  })

  const onViewHistory = async (market: number, product: string) => {
    const key = `${market}:${product}`
    if (historyFor === key) {
      setHistoryFor(null)
      setHistory([])
      return
    }
    setHistoryFor(key)
    setHistoryBusy(true)
    setError(null)
    try {
      const rows = await pricesApi.history({ market, product })
      setHistory(rows)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setHistoryFor(null)
    } finally {
      setHistoryBusy(false)
    }
  }

  const marketOptions = new Map<number, Market>(markets.map((m) => [m.id, m]))

  return (
    <div className="content">
      <div className="agri-page-header">
        <h1><i className="bi bi-graph-up me-2 text-success" />Market Prices</h1>
        <p>Latest produce prices across major Ugandan markets.</p>
      </div>

      {error && <div className="alert alert-agri-error">{error}</div>}

      <div className="agri-filter-bar">
        <form
          className="row g-2"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-search text-muted" /></span>
              <input
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. maize"
              />
            </div>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
            >
              <option value="">All markets</option>
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="agri-empty">
            <i className="bi bi-graph-up" />
            No market prices match your search.
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map((price) => (
              <div key={price.id} className="col-md-6 col-lg-4">
                <div className="agri-card card h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start">
                      <h5 className="fw-bold mb-1">
                        <i className="bi bi-cash-coin me-1 text-success" />
                        {price.product}
                      </h5>
                      <span className="badge badge-agri">{price.market_name}</span>
                    </div>
                    <p className="mb-2" style={{ color: '#1b5e20', fontWeight: 700, fontSize: '1.2rem' }}>
                      UGX {Number(price.price).toLocaleString()}<span className="text-muted fs-6 fw-normal"> / {price.unit}</span>
                    </p>
                    <p className="text-muted small mb-0">
                      <i className="bi bi-calendar3 me-1" />{price.price_date}
                      {price.source ? ` · source: ${price.source}` : ''}
                    </p>
                    <div className="mt-auto pt-3">
                      <button
                        type="button"
                        className="btn-agri-outline btn-sm w-100"
                        disabled={historyBusy && historyFor === `${price.market}:${price.product}`}
                        onClick={() => void onViewHistory(price.market, price.product)}
                      >
                        <i className="bi bi-clock-history me-1" />
                        {historyFor === `${price.market}:${price.product}`
                          ? historyBusy
                            ? 'Loading…'
                            : 'Hide history'
                          : 'View history'}
                      </button>
                      {historyFor === `${price.market}:${price.product}` &&
                        history.length > 0 && (
                          <div className="table-responsive mt-3">
                            <table className="table agri-table table-sm mb-0">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Price</th>
                                  <th>Unit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map((row) => (
                                  <tr key={row.id}>
                                    <td>{row.price_date}</td>
                                    <td className="fw-semibold">UGX {Number(row.price).toLocaleString()}</td>
                                    <td>{row.unit}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      {historyFor === `${price.market}:${price.product}` &&
                        history.length === 0 &&
                        !historyBusy && (
                          <p className="text-muted small mt-3 mb-0">
                            No recorded history for {price.product} at{' '}
                            {marketOptions.get(price.market)?.name ?? price.market_name}.
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}