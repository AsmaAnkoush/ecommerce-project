import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminOrders, updateOrderStatus } from '../../api/adminApi'
import Spinner from '../../components/ui/Spinner'
import { useFormatPrice } from '../../utils/formatPrice'
import { useLanguage } from '../../context/LanguageContext'

/* ─── Status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    bg: '#FFFBEB', text: '#92400E', border: '#FCD34D', dot: '#F59E0B' },
  CONFIRMED:  { label: 'Confirmed',  bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  CANCELLED:  { label: 'Cancelled',  bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
}
const ALL_STATUSES = ['PENDING','CONFIRMED','CANCELLED']

const TAB_KEYS = ['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED']

/* ─── Status badge ──────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const { t } = useLanguage()
  const c = STATUS_CONFIG[status] || { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB', dot: '#9CA3AF' }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontFamily: 'Raleway, sans-serif' }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      {t('status.' + status)}
    </span>
  )
}

/* ─── WhatsApp ──────────────────────────────────────────────────────────── */
const waLink = (phone, orderId) => {
  const msg = encodeURIComponent(`مرحبا، تم استلام طلبك رقم #${orderId}. هل تؤكد الطلب؟ يرجى إرسال الموقع.`)
  return `https://wa.me/${phone?.replace(/\D/g, '')}?text=${msg}`
}

function WaBtn({ phone, orderId }) {
  if (!phone) return null
  return (
    <a
      href={waLink(phone, orderId)}
      target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
      style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', textDecoration: 'none' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#BBF7D0'; e.currentTarget.style.borderColor = '#4ADE80' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#DCFCE7'; e.currentTarget.style.borderColor = '#86EFAC' }}
    >
      <svg viewBox="0 0 24 24" className="shrink-0" style={{ width: 13, height: 13, fill: '#16A34A' }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      WhatsApp
    </a>
  )
}

/* ─── Inline label+value ────────────────────────────────────────────────── */
function InfoPair({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif' }}>{value}</p>
    </div>
  )
}

/* ─── Expanded detail ───────────────────────────────────────────────────── */
function OrderDetail({ order, updating, onStatusChange }) {
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  return (
    <div className="px-5 py-5 space-y-5" style={{ borderTop: '1px solid #F5EDEF', background: '#FDFBFC' }}>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoPair label={t('admin.shippingAddress')} value={[order.shippingAddress, order.city].filter(Boolean).join(', ')} />
        <InfoPair label={t('admin.paymentMethod')}   value={order.paymentMethod} />
        <InfoPair label={t('admin.notes')}            value={order.notes} />
      </div>

      {/* Items */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>
          {t('admin.orderItems')}
        </p>
        <div className="space-y-2">
          {order.items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: '#fff', border: '1px solid #F5EDEF' }}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ background: '#FDF0F2', border: '1px solid #EDD8DC' }}>
                {item.productImage && (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif' }}>
                  {item.productName}
                </p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {item.size && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: '#FDF0F2', color: '#9B7B80', border: '1px solid #EDD8DC' }}>
                      {item.size}
                    </span>
                  )}
                  {item.color && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: '#FDF0F2', color: '#9B7B80', border: '1px solid #EDD8DC' }}>
                      {item.color}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif' }}>
                  {formatPrice(item.subtotal)}
                </p>
                <p className="text-xs" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>×{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap pt-1" style={{ borderTop: '1px solid #F5EDEF', paddingTop: '16px' }}>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold" style={{ color: '#9B7B80', fontFamily: 'Raleway, sans-serif' }}>
            {t('admin.status')}:
          </label>
          <select
            value={order.status}
            onChange={e => onStatusChange(order.id, e.target.value)}
            disabled={updating === order.id}
            className="text-xs font-medium rounded-xl px-3 py-1.5 outline-none transition-colors"
            style={{
              border: '1px solid #EDD8DC',
              color: '#3D1A1E',
              background: '#fff',
              fontFamily: 'Raleway, sans-serif',
            }}
            onFocus={e => e.target.style.borderColor = '#DFA3AD'}
            onBlur={e => e.target.style.borderColor = '#EDD8DC'}
          >
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{t('status.' + s)}</option>
            ))}
          </select>
          {updating === order.id && (
            <span className="text-xs flex items-center gap-1" style={{ color: '#C4A0A6' }}>
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {t('admin.saving')}
            </span>
          )}
        </div>

        <WaBtn phone={order.customerPhone} orderId={order.id} />

        <Link
          to={`/admin/orders/${order.id}`}
          onClick={e => e.stopPropagation()}
          className="ml-auto text-xs font-semibold flex items-center gap-1 transition-colors"
          style={{ color: '#C4A0A6', textDecoration: 'none', fontFamily: 'Raleway, sans-serif' }}
          onMouseEnter={e => e.currentTarget.style.color = '#6B1F2A'}
          onMouseLeave={e => e.currentTarget.style.color = '#C4A0A6'}
        >
          {t('admin.fullDetails')}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

/* ─── Main ──────────────────────────────────────────────────────────────── */
export default function AdminOrders() {
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [expanded, setExpanded]     = useState(null)
  const [updating, setUpdating]     = useState(null)
  const [activeTab, setActiveTab]   = useState('ALL')

  const fetchOrders = async (p = 0) => {
    setLoading(true)
    try {
      const res = await getAdminOrders({ page: p, size: 15 })
      setOrders(res.data.data?.content ?? [])
      setTotalPages(res.data.data?.totalPages ?? 0)
      setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [])

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId)
    try { await updateOrderStatus(orderId, status); await fetchOrders(page) }
    finally { setUpdating(null) }
  }

  const displayed = activeTab === 'ALL' ? orders : orders.filter(o => o.status === activeTab)
  const countFor  = key => key === 'ALL' ? orders.length : orders.filter(o => o.status === key).length

  return (
    <div className="p-5 lg:p-7">

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {TAB_KEYS.map(key => {
          const count    = countFor(key)
          const isActive = activeTab === key
          const label    = key === 'ALL' ? t('admin.allOrders') : t('status.' + key)
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                fontFamily: 'Raleway, sans-serif',
                background: isActive ? '#6B1F2A' : '#fff',
                color:      isActive ? '#fff'    : '#9B7B80',
                border:     isActive ? '1px solid #6B1F2A' : '1px solid #F0DDE0',
                boxShadow:  isActive ? '0 2px 10px rgba(107,31,42,0.2)' : 'none',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#FDF0F2'; e.currentTarget.style.color = '#6B1F2A'; e.currentTarget.style.borderColor = '#EDD8DC' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#9B7B80'; e.currentTarget.style.borderColor = '#F0DDE0' } }}
            >
              {label}
              {count > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg min-w-[18px] text-center"
                  style={isActive
                    ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                    : { background: '#FDF0F2', color: '#9B7B80' }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#FDF0F2', border: '1px solid #EDD8DC' }}>
            <svg className="w-8 h-8" style={{ color: '#DFA3AD' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>{t('admin.noOrdersFound')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayed.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
              style={{ boxShadow: '0 1px 4px rgba(107,31,42,0.06), 0 0 0 1px #F5EDEF' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,31,42,0.10), 0 0 0 1px #EDD8DC'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(107,31,42,0.06), 0 0 0 1px #F5EDEF'}
            >
              {/* ── Header row ── */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                {/* Order # */}
                <div className="shrink-0 min-w-[52px]">
                  <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>{t('admin.order')}</p>
                  <p className="text-sm font-bold" style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif' }}>#{order.id}</p>
                </div>

                <div className="w-px h-8 shrink-0" style={{ background: '#F0DDE0' }} />

                {/* Customer */}
                <div className="flex-1 min-w-0 hidden sm:block">
                  <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>{t('admin.customer')}</p>
                  <p className="text-sm font-medium truncate" style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif' }}>{order.customerName || 'N/A'}</p>
                </div>

                {/* Phone */}
                <div className="flex-1 min-w-0 hidden md:flex flex-col">
                  <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>{t('admin.phone')}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm" style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif' }}>{order.customerPhone || '—'}</p>
                    {order.customerPhone && (
                      <a
                        href={waLink(order.customerPhone, order.id)}
                        target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: '#22C55E' }}
                        title="WhatsApp"
                        onMouseEnter={e => e.currentTarget.style.background = '#16A34A'}
                        onMouseLeave={e => e.currentTarget.style.background = '#22C55E'}
                      >
                        <svg viewBox="0 0 24 24" style={{ width: 10, height: 10, fill: '#fff' }}>
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="hidden lg:flex flex-col shrink-0">
                  <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>{t('admin.date')}</p>
                  <p className="text-sm" style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif' }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                  </p>
                </div>

                {/* Total */}
                <div className="shrink-0 text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>{t('admin.total')}</p>
                  <p className="text-sm font-bold" style={{ color: '#6B1F2A', fontFamily: 'Raleway, sans-serif' }}>
                    {formatPrice(order.totalAmount)}
                  </p>
                </div>

                {/* Status badge */}
                <div className="shrink-0 hidden sm:block">
                  <StatusBadge status={order.status} />
                </div>

                {/* Chevron */}
                <svg
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${expanded === order.id ? 'rotate-180' : ''}`}
                  style={{ color: '#DFA3AD' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded detail */}
              {expanded === order.id && (
                <OrderDetail order={order} updating={updating} onStatusChange={handleStatusChange} />
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 pt-5">
              <button
                onClick={() => fetchOrders(page - 1)} disabled={page === 0}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-colors disabled:opacity-30"
                style={{ border: '1px solid #EDD8DC', color: '#9B7B80', background: '#fff' }}
                onMouseEnter={e => { if (page > 0) e.currentTarget.style.background = '#FDF0F2' }}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >‹</button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i} onClick={() => fetchOrders(i)}
                  className="w-8 h-8 rounded-xl text-xs font-semibold transition-all"
                  style={i === page
                    ? { background: '#6B1F2A', color: '#fff', border: '1px solid #6B1F2A', boxShadow: '0 2px 8px rgba(107,31,42,0.25)' }
                    : { border: '1px solid #EDD8DC', color: '#9B7B80', background: '#fff' }
                  }
                  onMouseEnter={e => { if (i !== page) e.currentTarget.style.background = '#FDF0F2' }}
                  onMouseLeave={e => { if (i !== page) e.currentTarget.style.background = '#fff' }}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => fetchOrders(page + 1)} disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-colors disabled:opacity-30"
                style={{ border: '1px solid #EDD8DC', color: '#9B7B80', background: '#fff' }}
                onMouseEnter={e => { if (page < totalPages - 1) e.currentTarget.style.background = '#FDF0F2' }}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >›</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
