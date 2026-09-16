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
        <div className="agri-empty">
          <i className="bi bi-box-arrow-in-right" />
          Please log in to view your orders. <Link to="/login">Login</Link>
        </div>
      </div>
    )
  }

  const isFarmer = user.role === 'FARMER'

  return (
    <div className="content">
      <div className="agri-page-header">
        <h1>
          <i className={`bi ${isFarmer ? 'bi-inbox' : 'bi-cart-check'} me-2 text-success`} />
          {isFarmer ? 'Orders Received' : 'My Orders'}
        </h1>
        <p>
          {isFarmer ? 'Manage orders placed on your listings.' : 'Track your orders and their status.'}
        </p>
      </div>

      {error && <div className="alert alert-agri-error">{error}</div>}

      <div>
        {orders.length === 0 ? (
          <div className="agri-empty">
            <i className="bi bi-cart" />
            {isFarmer ? 'No orders received yet.' : (
              <>No orders yet. Browse the <Link to="/marketplace">marketplace</Link> to place an order.</>
            )}
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {orders.map((order) => (
              <div key={order.id} className="agri-list-item">
                <div>
                  <h5>
                    <i className="bi bi-box-seam me-1 text-success" />
                    {order.listing_product_name}
                    <span className={`badge badge-${order.status.toLowerCase()} ms-2`}>
                      {order.status_display}
                    </span>
                  </h5>
                  <p>
                    {isFarmer ? <><i className="bi bi-person me-1" />Buyer: {order.buyer_name}</> : <><i className="bi bi-person me-1" />Seller: {order.listing_product_name}</>}
                    {' · '}
                    <i className="bi bi-box me-1" />{order.quantity} {order.listing_unit}
                    {' · '}
                    <strong className="text-success">UGX {Number(order.total_price).toLocaleString()}</strong>
                  </p>
                  {order.notes && <p className="mb-0">Buyer note: {order.notes}</p>}
                  {order.farmer_notes && <p className="mb-0">Farmer note: {order.farmer_notes}</p>}
                </div>
                <div className="list-actions">
                  {isFarmer && order.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        className="btn-agri btn-sm"
                        disabled={busy}
                        onClick={() => void onAction(order.id, { status: 'ACCEPTED' })}
                      >
                        <i className="bi bi-check-lg me-1" />Accept
                      </button>
                      <button
                        type="button"
                        className="btn-agri-danger btn-sm"
                        disabled={busy}
                        onClick={() => void onAction(order.id, { status: 'REJECTED' })}
                      >
                        <i className="bi bi-x-lg me-1" />Reject
                      </button>
                    </>
                  )}
                  {isFarmer && order.status === 'ACCEPTED' && (
                    <button
                      type="button"
                      className="btn-agri btn-sm"
                      disabled={busy}
                      onClick={() => void onAction(order.id, { status: 'COMPLETED' })}
                    >
                      <i className="bi bi-check2-square me-1" />Mark complete
                    </button>
                  )}
                  {!isFarmer && (order.status === 'PENDING' || order.status === 'ACCEPTED') && (
                    <button
                      type="button"
                      className="btn-agri-danger btn-sm"
                      disabled={busy}
                      onClick={() => void onAction(order.id, { status: 'CANCELLED' })}
                    >
                      <i className="bi bi-x-circle me-1" />Cancel order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}