import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrders } from '../api/orderApi'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

const STATUS_VARIANT = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrders()
      .then((res) => setOrders(res.data.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center py-40"><Spinner size="lg" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-10">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 font-medium text-lg">No orders yet</p>
          <Link to="/products" className="mt-4 inline-block text-sm font-medium bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-bold text-gray-900">Order #{order.id}</p>
                    <Badge variant={STATUS_VARIANT[order.status] || 'default'}>{order.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {order.shippingAddress}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gray-900">₪{Number(order.totalAmount).toFixed(0)}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                    View details
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </p>
                </div>
              </div>

              {/* Item thumbnails */}
              <div className="flex gap-2 mt-4">
                {order.items.slice(0, 5).map((item) => (
                  <div key={item.id} className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                    )}
                  </div>
                ))}
                {order.items.length > 5 && (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 font-medium">
                    +{order.items.length - 5}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
