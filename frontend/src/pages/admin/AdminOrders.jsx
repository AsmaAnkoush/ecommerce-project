import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminOrders, updateOrderStatus, archiveOrder, getArchivedOrders } from '../../api/adminApi'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/layout/PageHeader'
import { useFormatPrice } from '../../utils/formatPrice'
import { useLanguage } from '../../context/LanguageContext'

/* ─── Status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    bg: '#FFFBEB', text: '#92400E', border: '#FCD34D', dot: '#F59E0B' },
  CONFIRMED:  { label: 'Confirmed',  bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  CANCELLED:  { label: 'Cancelled',  bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
}
const ALL_STATUSES = ['PENDING','CONFIRMED','CANCELLED']

const TAB_KEYS = ['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED', 'ARCHIVED']

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
function buildWaMessage(items) {
  const first = items?.[0] || {}
  const lines = [
    'مرحبًا 🌸',
    'هل تود تأكيد طلبك بناءً على التفاصيل التي قمت بإدخالها؟',
    '',
  ]
  if (first.productName) lines.push(`📦 المنتج: ${first.productName}`)
  if (first.color)       lines.push(`🎨 اللون: ${first.color}`)
  if (first.size)        lines.push(`📏 المقاس: ${first.size}`)
  lines.push('', 'يرجى تأكيد الطلب وإرسال الموقع 📍')
  return lines.join('\n')
}

const waLink = (phone, items) => {
  const msg = encodeURIComponent(buildWaMessage(items))
  return `https://wa.me/${phone?.replace(/\D/g, '')}?text=${msg}`
}

function WaBtn({ phone, items }) {
  if (!phone) return null
  return (
    <a
      href={waLink(phone, items)}
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
function OrderDetail({ order, updating, onStatusChange, onArchive, archiving }) {
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

      <div className="border-t border-[#F5EDEF]" />

      {/* Items */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>
          {t('admin.orderItems')} ({order.items.length})
        </p>
        <div className="space-y-2.5">
          {order.items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-3 rounded-xl"
              style={{ background: '#fff', border: '1px solid #F5EDEF' }}
            >
              {/* Image */}
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#EDD8DC]" style={{ background: '#FDF0F2' }}>
                {item.productImage && (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Name + variant chips */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif' }}>
                  {item.productName}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {item.color && (
                    <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: '#6B4E53' }}>
                      <span
                        className="inline-block w-3.5 h-3.5 rounded-full border"
                        style={{ backgroundColor: item.color, borderColor: '#D9CDD0', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)' }}
                        aria-label={item.color}
                        title={item.color}
                      />
                      <span className="text-[10px] uppercase tracking-wide text-[#C4A0A6]">{t('admin.COLOR')}</span>
                    </span>
                  )}
                  {item.size && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: '#FDF0F2', color: '#6B1F2A', border: '1px solid #EDD8DC' }}>
                      <span className="text-[10px] text-[#C4A0A6] uppercase tracking-wide">{t('admin.SIZE')}</span>
                      {item.size}
                    </span>
                  )}
                </div>
              </div>

              {/* Qty */}
              <div className="shrink-0 text-center">
                <p className="text-[10px] uppercase tracking-wide" style={{ color: '#C4A0A6' }}>{t('cart.qty') || 'Qty'}</p>
                <p className="text-sm font-semibold tabular-nums" style={{ color: '#3D1A1E' }}>×{item.quantity}</p>
              </div>

              {/* Price */}
              <div className="shrink-0 text-end min-w-[88px]">
                <p className="text-sm font-bold tabular-nums" style={{ color: '#6B1F2A', fontFamily: 'Raleway, sans-serif' }}>
                  {formatPrice(item.subtotal)}
                </p>
                <p className="text-[10px]" style={{ color: '#C4A0A6' }}>{formatPrice(item.unitPrice)} {t('cart.perItem')}</p>
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
            disabled={updating === order.id || order.isArchived}
            className="text-xs font-medium rounded-xl px-3 py-1.5 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              border: '1px solid #EDD8DC',
              color: '#3D1A1E',
              background: order.isArchived ? '#F9FAFB' : '#fff',
              fontFamily: 'Raleway, sans-serif',
            }}
            onFocus={e => { if (!order.isArchived) e.target.style.borderColor = '#DFA3AD' }}
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

        <WaBtn phone={order.customerPhone} items={order.items} />

        {!order.isArchived && order.status !== 'CONFIRMED' && order.status !== 'CANCELLED' && (
          <span className="text-xs text-gray-400 mt-2 inline-flex items-center gap-1.5" title={t('admin.archiveTooltip')}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('admin.archiveBlockedHint')}
          </span>
        )}

        {!order.isArchived && (order.status === 'CONFIRMED' || order.status === 'CANCELLED') && onArchive && (
          <button
            type="button"
            onClick={() => onArchive(order.id)}
            disabled={archiving === order.id}
            title={t('admin.archiveTooltip')}
            aria-label={t('admin.archive')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
            style={{ background: '#F5EDEF', color: '#6B1F2A', border: '1px solid #EDD8DC' }}
            onMouseEnter={e => e.currentTarget.style.background = '#EDD8DC'}
            onMouseLeave={e => e.currentTarget.style.background = '#F5EDEF'}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {archiving === order.id ? '…' : t('admin.archive')}
          </button>
        )}

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
  const { toast } = useToast()
  const formatPrice = useFormatPrice()
  const [orders, setOrders]                 = useState([])
  const [archivedOrders, setArchivedOrders] = useState([])
  const [loading, setLoading]               = useState(true)
  const [page, setPage]                     = useState(0)
  const [totalPages, setTotalPages]         = useState(0)
  const [expanded, setExpanded]             = useState(null)
  const [updating, setUpdating]             = useState(null)
  const [archiving, setArchiving]           = useState(null)
  const [activeTab, setActiveTab]           = useState('ALL')

  const isArchivedTab = activeTab === 'ARCHIVED'

  const fetchOrders = async (p = 0, tab = activeTab) => {
    setLoading(true)
    try {
      if (tab === 'ARCHIVED') {
        const res = await getArchivedOrders({ page: p, size: 15 })
        setArchivedOrders(res.data.data?.content ?? [])
        setTotalPages(res.data.data?.totalPages ?? 0)
      } else {
        const res = await getAdminOrders({ page: p, size: 15 })
        setOrders(res.data.data?.content ?? [])
        setTotalPages(res.data.data?.totalPages ?? 0)
      }
      setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders(0, 'ALL') }, [])

  const handleTabChange = (next) => {
    if (next === activeTab) return
    setActiveTab(next)
    setExpanded(null)
    fetchOrders(0, next)
  }

  const handleArchive = async (orderId) => {
    setArchiving(orderId)
    try {
      const res = await archiveOrder(orderId)
      const updated = res?.data?.data
      // Drop from the active list immediately so the UI updates without a refetch.
      setOrders(prev => {
        const removed = prev.find(o => o.id === orderId)
        if (removed && updated) {
          // Optionally surface it in the Archived bucket so a tab switch shows it
          // right away (avoids a redundant refetch).
          setArchivedOrders(arch => arch.some(o => o.id === orderId)
            ? arch
            : [{ ...removed, ...updated, isArchived: true }, ...arch]
          )
        }
        return prev.filter(o => o.id !== orderId)
      })
      toast(t('admin.orderArchived'))
    } catch (err) {
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally { setArchiving(null) }
  }

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId)
    try { await updateOrderStatus(orderId, status); await fetchOrders(page, activeTab) }
    finally { setUpdating(null) }
  }

  const displayed = isArchivedTab
    ? archivedOrders
    : activeTab === 'ALL'
      ? orders
      : orders.filter(o => o.status === activeTab)
  const countFor = key => {
    if (key === 'ARCHIVED') return archivedOrders.length
    if (key === 'ALL')      return orders.length
    return orders.filter(o => o.status === key).length
  }

  return (
    <div>
      <PageHeader />
      <div className="p-5 lg:p-7 pt-0">

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {TAB_KEYS.map(key => {
          const count    = countFor(key)
          const isActive = activeTab === key
          const label    = key === 'ALL'      ? t('admin.allOrders')
                         : key === 'ARCHIVED' ? t('admin.archived')
                         : t('status.' + key)
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
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

      {/* Helper note explaining the Confirmed transition */}
      <p className="text-sm text-gray-500 mt-2 mb-5 flex items-start gap-2" style={{ fontFamily: 'Raleway, sans-serif' }}>
        <svg className="w-4 h-4 shrink-0 mt-0.5 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{t('admin.confirmedHint')}</span>
      </p>

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
          <p className="text-sm font-medium" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>
            {isArchivedTab ? (t('admin.noArchivedOrders') || 'لا توجد طلبات مؤرشفة') : t('admin.noOrdersFound')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(order => {
            const isOpen = expanded === order.id
            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm transition-shadow duration-200 hover:shadow-md ${order.isArchived ? 'opacity-80' : ''}`}
              >
                {/* ── Header — clickable summary ── */}
                <div
                  className="px-5 py-4 cursor-pointer select-none"
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                >
                  {/* Top row: Order# + Customer | Phone+WA | Date/Time + Total + Status */}
                  <div className="flex items-start gap-4 flex-wrap lg:flex-nowrap">

                    {/* Order # + Customer */}
                    <div className="min-w-0 flex-1 lg:flex-initial lg:w-48">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-md" style={{ background: '#FDF0F2', color: '#6B1F2A', border: '1px solid #EDD8DC' }}>
                          #{order.id}
                        </span>
                        {order.isGuest && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{t('admin.guest')}</span>
                        )}
                        {order.isArchived && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            {t('admin.archived')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold truncate mt-1.5" style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif' }}>
                        {order.customerName || 'N/A'}
                      </p>
                    </div>

                    {/* Phone + WhatsApp */}
                    <div className="min-w-0 flex-1 lg:flex-initial lg:w-56">
                      {order.customerPhone ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={waLink(order.customerPhone, order.items)}
                            target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
                            style={{ background: '#22C55E' }}
                            title="WhatsApp"
                            onMouseEnter={e => e.currentTarget.style.background = '#16A34A'}
                            onMouseLeave={e => e.currentTarget.style.background = '#22C55E'}
                          >
                            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: '#fff' }}>
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                          <p className="text-sm tabular-nums truncate" style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif' }} dir="ltr">
                            {order.customerPhone}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">—</p>
                      )}
                    </div>

                    {/* Date + Time */}
                    <div className="shrink-0 lg:w-32">
                      {order.createdAt ? (
                        <>
                          <p className="text-sm font-medium" style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif' }}>
                            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </p>
                          <p className="text-[11px] tabular-nums mt-0.5" style={{ color: '#9B7B80', fontFamily: 'Raleway, sans-serif' }}>
                            {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">—</p>
                      )}
                    </div>

                    {/* Total + Status + chevron */}
                    <div className="shrink-0 flex items-center gap-3 ms-auto">
                      <div className="text-end">
                        <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>{t('admin.total')}</p>
                        <p className="text-base font-bold tabular-nums" style={{ color: '#6B1F2A', fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}>
                          {formatPrice(order.totalAmount)}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                      <svg
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        style={{ color: '#DFA3AD' }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Second row — shipping + notes (always visible, truncated) */}
                  {(order.shippingAddress || order.notes) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs" style={{ color: '#6B4E53', fontFamily: 'Raleway, sans-serif' }}>
                      {order.shippingAddress && (
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <svg className="w-3.5 h-3.5 shrink-0 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate max-w-[260px] sm:max-w-[420px]">
                            {[order.shippingAddress, order.city].filter(Boolean).join(', ')}
                          </span>
                        </span>
                      )}
                      {order.notes && (
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <svg className="w-3.5 h-3.5 shrink-0 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="truncate max-w-[260px] sm:max-w-[360px] italic">{order.notes}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Expanded body — items + actions ── */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{ maxHeight: isOpen ? '1600px' : '0', opacity: isOpen ? 1 : 0 }}
                >
                  {isOpen && (
                    <OrderDetail
                      order={order}
                      updating={updating}
                      onStatusChange={handleStatusChange}
                      onArchive={handleArchive}
                      archiving={archiving}
                    />
                  )}
                </div>
              </div>
            )
          })}

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
    </div>
  )
}
