import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { getApiErrorMessage } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { ordersApi } from '../marketplace/api'
import type { Order, OrderUpdatePayload } from '../marketplace/types'

export function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const page = await ordersApi.list()
      setOrders(page.results)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    if (user) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const onAction = async (id: number, payload: OrderUpdatePayload) => {
    setBusy(true)
    setError(null)
    try {
      await ordersApi.update(id, payload)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!user) {
    return (
      <div className="content">
        <p>Please log in to view your orders. <Link to="/login">Login</Link></p>
      </div>
    )
  }

  const isFarmer = user.role === 'FARMER'

  return (
    <div className="content">
      <div>
        <h1 className="page-title">{isFarmer ? 'Orders Received' : 'My Orders'}</h1>
        <p className="page-subtitle">
          {isFarmer ? 'Manage orders placed on your listings.' : 'Track your orders and their status.'}
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="section">
        {orders.length === 0 ? (
          <div className="empty">
            {isFarmer ? 'No orders received yet.' : (
              <>No orders yet. Browse the <Link to="/marketplace">marketplace</Link> to place an order.</>
            )}
          </div>
        ) : (
          <div className="list">
            {orders.map((order) => (
              <div key={order.id} className="list-item">
                <div>
                  <h3>
                    {order.listing_product_name}
                    <span className={`badge badge-${order.status.toLowerCase()}`} style={{ marginLeft: '0.5rem' }}>
                      {order.status_display}
                    </span>
                  </h3>
                  <p>
                    {isFarmer ? `Buyer: ${order.buyer_name}` : `Seller: ${order.listing_product_name}`}
                    {' · '}
                    {order.quantity} {order.listing_unit}
                    {' · '}
                    UGX {Number(order.total_price).toLocaleString()}
                  </p>
                  {order.notes && <p className="text-muted">Buyer note: {order.notes}</p>}
                  {order.farmer_notes && <p className="text-muted">Farmer note: {order.farmer_notes}</p>}
                </div>
                <div className="item-actions">
                  {isFarmer && order.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        disabled={busy}
                        onClick={() => void onAction(order.id, { status: 'ACCEPTED' })}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        disabled={busy}
                        onClick={() => void onAction(order.id, { status: 'REJECTED' })}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {isFarmer && order.status === 'ACCEPTED' && (
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      disabled={busy}
                      onClick={() => void onAction(order.id, { status: 'COMPLETED' })}
                    >
                      Mark complete
                    </button>
                  )}
                  {!isFarmer && (order.status === 'PENDING' || order.status === 'ACCEPTED') && (
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      disabled={busy}
                      onClick={() => void onAction(order.id, { status: 'CANCELLED' })}
                    >
                      Cancel order
                    </button>
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
