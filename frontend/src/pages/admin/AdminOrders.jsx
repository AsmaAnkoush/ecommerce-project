import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminOrders, updateOrderStatus } from '../../api/adminApi'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

const STATUS_VARIANT = { PENDING: 'warning', CONFIRMED: 'info', PROCESSING: 'info', SHIPPED: 'info', DELIVERED: 'success', CANCELLED: 'danger' }
const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)

  const fetch = async (p = 0) => {
    setLoading(true)
    try {
      const res = await getAdminOrders({ page: p, size: 15 })
      setOrders(res.data.data?.content ?? [])
      setTotalPages(res.data.data?.totalPages ?? 0)
      setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId)
    try { await updateOrderStatus(orderId, status); await fetch(page) }
    finally { setUpdating(null) }
  }

  const whatsappLink = (phone, orderId) => {
    const msg = encodeURIComponent(`مرحبا، تم استلام طلبك رقم #${orderId}. هل تؤكد الطلب؟ يرجى إرسال الموقع.`)
    return `https://wa.me/${phone?.replace(/\D/g, '')}?text=${msg}`
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Orders</h1>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Order</p>
                    <p className="font-semibold text-gray-900">#{order.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Customer</p>
                    <p className="font-medium text-gray-900">{order.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-gray-900">{order.customerPhone || 'N/A'}</p>
                      {order.customerPhone && (
                        <a href={whatsappLink(order.customerPhone, order.id)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors shrink-0"
                          title="Contact on WhatsApp">
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="font-bold text-gray-900">₪{Number(order.totalAmount).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <Badge variant={STATUS_VARIANT[order.status] || 'default'}>{order.status}</Badge>
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expanded === order.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded detail */}
              {expanded === order.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Shipping Address</p>
                      <p className="text-gray-800">{order.shippingAddress}</p>
                    </div>
                    {order.notes && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Notes</p>
                        <p className="text-gray-800">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Items</p>
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 text-sm">
                          <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-200">
                            {item.productImage && <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-800 truncate">{item.productName}</p>
                            <div className="flex gap-1.5 mt-0.5">
                              {item.size && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{item.size}</span>}
                              {item.color && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{item.color}</span>}
                            </div>
                          </div>
                          <span className="text-gray-500">×{item.quantity}</span>
                          <span className="font-semibold">₪{Number(item.subtotal).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-xs font-medium text-gray-600">Update Status:</label>
                    <select value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      disabled={updating === order.id}
                      className="text-sm border border-[#EDD8DC] rounded-xl px-2 py-1.5 focus:outline-none focus:border-[#6B1F2A] bg-white">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {updating === order.id && <span className="text-xs text-gray-400">Updating...</span>}

                    {order.customerPhone && (
                      <a
                        href={whatsappLink(order.customerPhone, order.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white shrink-0">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        إرسال رسالة
                      </a>
                    )}

                    <Link to={`/admin/orders/${order.id}`}
                      onClick={e => e.stopPropagation()}
                      className="ms-auto text-xs font-medium text-[#6B1F2A] hover:text-[#8B2535] transition-colors flex items-center gap-1">
                      View Full Details →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => fetch(i)}
                  className={`w-8 h-8 text-sm rounded-lg ${i === page ? 'bg-[#6B1F2A] text-white' : 'border border-[#EDD8DC] text-[#6B3840] hover:bg-[#FDF0F2]'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
