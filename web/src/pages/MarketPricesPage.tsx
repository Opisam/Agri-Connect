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
      <div>
        <h1 className="page-title">Market Prices</h1>
        <p className="page-subtitle">
          Latest produce prices across major Ugandan markets.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label className="form-field">
            Product
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. maize"
            />
          </label>
          <label className="form-field">
            Market
            <select
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
          </label>
        </form>
      </section>

      <section className="section">
        {filtered.length === 0 ? (
          <div className="empty">No market prices match your search.</div>
        ) : (
          <div className="list">
            {filtered.map((price) => (
              <div key={price.id} className="list-item">
                <div>
                  <h3>
                    {price.product}
                    <span className="badge" style={{ marginLeft: '0.5rem' }}>
                      {price.market_name}
                    </span>
                  </h3>
                  <p>
                    UGX {Number(price.price).toLocaleString()} / {price.unit}
                    {' · '}
                    {price.price_date}
                    {price.source ? ` · source: ${price.source}` : ''}
                  </p>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    disabled={historyBusy && historyFor === `${price.market}:${price.product}`}
                    onClick={() => void onViewHistory(price.market, price.product)}
                  >
                    {historyFor === `${price.market}:${price.product}`
                      ? historyBusy
                        ? 'Loading…'
                        : 'Hide history'
                      : 'View history'}
                  </button>
                  {historyFor === `${price.market}:${price.product}` &&
                    history.length > 0 && (
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Price</th>
                            <th>Unit</th>
                            <th>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((row) => (
                            <tr key={row.id}>
                              <td>{row.price_date}</td>
                              <td>UGX {Number(row.price).toLocaleString()}</td>
                              <td>{row.unit}</td>
                              <td>{row.source || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  {historyFor === `${price.market}:${price.product}` &&
                    history.length === 0 &&
                    !historyBusy && (
                      <p className="text-muted">
                        No recorded history for {price.product} at{' '}
                        {marketOptions.get(price.market)?.name ?? price.market_name}.
                      </p>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}