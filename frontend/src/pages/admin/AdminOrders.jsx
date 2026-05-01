import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminOrders, updateOrderStatus, updateOrderItemStatus, archiveOrder, getArchivedOrders, deleteOrder } from '../../api/adminApi'
import { formatLocalDate, formatLocalTime } from '../../utils/dateUtils'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/layout/PageHeader'
import { useFormatPrice } from '../../utils/formatPrice'
import { useLanguage } from '../../context/LanguageContext'

/* ─── Color name → hex (mirrors ProductCard COLOR_MAP) ─────────────────── */
const COLOR_MAP = {
  black:'#1A1A1A', white:'#F0EEE9', navy:'#1B2A4A', beige:'#F2EBD9',
  brown:'#7C4A2D', red:'#C0392B', green:'#2D6A4F', gray:'#8E8E8E',
  camel:'#C19A6B', burgundy:'#7A1F2E', olive:'#6B7C44', coral:'#E8715A',
  pink:'#F4A8B8', cream:'#FBF7ED', blue:'#1A56C4', yellow:'#F0C040',
  orange:'#D4600A', purple:'#6B2FA0',
}
const resolveColor = (name) => name
  ? (COLOR_MAP[name.toLowerCase().split(' ')[0]] ?? name)
  : null

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
function OrderDetail({ order, updating, onStatusChange, onArchive, archiving, onItemStatusChange, updatingItem }) {
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
          {order.items.map(item => {
            const iStatus = item.itemStatus || 'PENDING'
            const iCfg = STATUS_CONFIG[iStatus] || STATUS_CONFIG.PENDING
            const isItemFinal = iStatus === 'CONFIRMED' || iStatus === 'CANCELLED'
            return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: '#fff', border: `1px solid ${isItemFinal ? iCfg.border : '#F5EDEF'}` }}
            >
              {/* Image */}
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#EDD8DC]" style={{ background: '#FDF0F2' }}>
                {item.productImage && (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
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
                        style={{ backgroundColor: resolveColor(item.color), borderColor: '#D9CDD0', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)' }}
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
              <div className="shrink-0 text-end min-w-[80px]">
                <p className="text-sm font-bold tabular-nums" style={{ color: '#6B1F2A', fontFamily: 'Raleway, sans-serif' }}>
                  {formatPrice(item.subtotal)}
                </p>
                <p className="text-[10px]" style={{ color: '#C4A0A6' }}>{formatPrice(item.unitPrice)} {t('cart.perItem')}</p>
              </div>

              {/* Per-item status — locked badge when final, dropdown when still PENDING */}
              <div className="shrink-0 min-w-[96px] flex flex-col items-end gap-1">
                {isItemFinal ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap"
                    style={{ background: iCfg.bg, color: iCfg.text, border: `1px solid ${iCfg.border}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: iCfg.dot }} />
                    {iStatus}
                  </span>
                ) : (
                  <select
                    value={iStatus}
                    onChange={e => onItemStatusChange(order.id, item.id, e.target.value)}
                    disabled={updatingItem === item.id || order.isArchived}
                    className="text-[10px] font-semibold rounded-lg px-2 py-1 outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: iCfg.bg,
                      color: iCfg.text,
                      border: `1px solid ${iCfg.border}`,
                      fontFamily: 'Raleway, sans-serif',
                    }}
                  >
                    {['PENDING', 'CONFIRMED', 'CANCELLED'].map(s => (
                      <option key={s} value={s} style={{ background: '#fff', color: '#374151' }}>{s}</option>
                    ))}
                  </select>
                )}
                {updatingItem === item.id && (
                  <svg className="animate-spin w-3 h-3" style={{ color: '#C4A0A6' }} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                )}
              </div>
            </div>
            )
          })}
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
  const [confirmDelete, setConfirmDelete]   = useState(null)
  const [deleting, setDeleting]             = useState(false)
  const [updatingItem, setUpdatingItem]     = useState(null)

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
    try {
      await updateOrderStatus(orderId, status)
      // Optimistic update — avoid a full refetch so the row stays in place.
      const updater = list => list.map(o => o.id === orderId ? { ...o, status } : o)
      setOrders(updater)
      setArchivedOrders(updater)
      toast(t('admin.statusUpdated') || t('admin.toastStatusChanged'))
    } catch (err) {
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally { setUpdating(null) }
  }

  const handleItemStatusChange = async (orderId, itemId, status) => {
    setUpdatingItem(itemId)
    try {
      await updateOrderItemStatus(orderId, itemId, status)
      const updateItems = list => list.map(o =>
        o.id === orderId
          ? { ...o, items: o.items.map(i => i.id === itemId ? { ...i, itemStatus: status } : i) }
          : o
      )
      setOrders(updateItems)
      setArchivedOrders(updateItems)
      toast(t('admin.statusUpdated') || 'Item status updated')
    } catch (err) {
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally { setUpdatingItem(null) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await deleteOrder(confirmDelete.id)
      setOrders(prev => prev.filter(o => o.id !== confirmDelete.id))
      setArchivedOrders(prev => prev.filter(o => o.id !== confirmDelete.id))
      setConfirmDelete(null)
      toast(t('admin.orderDeleted'))
    } catch (err) {
      toast(err?.response?.data?.message || t('admin.failedDelete'), 'error')
    } finally { setDeleting(false) }
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
        <>
        <div className="admin-table-wrap">
          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('admin.order')} #</th>
                  <th>{t('admin.customer')}</th>
                  <th>{t('admin.phone') || 'Phone'}</th>
                  <th>{t('admin.total')}</th>
                  <th>{t('admin.date') || 'Date'}</th>
                  <th style={{ minWidth: 280 }}>{t('admin.itemsOrdered') || 'Products'}</th>
                  <th className="text-end">{t('admin.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(order => {
                  const isOpen = expanded === order.id
                  const canArchive = !order.isArchived && (order.status === 'CONFIRMED' || order.status === 'CANCELLED')
                  const isBusy = updating === order.id
                  const summary = (order.items || []).map(i =>
                    `${i.productName}${i.size ? ' - ' + i.size : ''}${i.color ? ' - ' + i.color : ''} (x${i.quantity})`
                  ).join(' • ')
                  return (
                    <Fragment key={order.id}>
                      <tr className={order.isArchived ? 'opacity-70' : ''}>
                        {/* Order # */}
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-md" style={{ background: '#FDF0F2', color: '#6B1F2A', border: '1px solid #EDD8DC' }}>
                              #{order.id}
                            </span>
                            {order.isGuest && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{t('admin.guest')}</span>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td>
                          <p className="text-sm font-semibold whitespace-nowrap" style={{ color: '#3D1A1E' }}>
                            {order.customerName || '—'}
                          </p>
                        </td>

                        {/* Phone + WA */}
                        <td>
                          {order.customerPhone ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={waLink(order.customerPhone, order.items)}
                                target="_blank" rel="noopener noreferrer"
                                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
                                style={{ background: '#22C55E' }}
                                title={t('common.whatsapp') || 'WhatsApp'}
                                onMouseEnter={e => e.currentTarget.style.background = '#16A34A'}
                                onMouseLeave={e => e.currentTarget.style.background = '#22C55E'}
                              >
                                <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: '#fff' }}>
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                              </a>
                              <span className="text-sm tabular-nums whitespace-nowrap" style={{ color: '#3D1A1E' }} dir="ltr">
                                {order.customerPhone}
                              </span>
                            </div>
                          ) : <span className="text-sm text-gray-400">—</span>}
                        </td>

                        {/* Total */}
                        <td>
                          <p className="text-sm font-bold tabular-nums whitespace-nowrap" style={{ color: '#6B1F2A' }}>
                            {formatPrice(order.totalAmount)}
                          </p>
                        </td>

                        {/* Date & time */}
                        <td>
                          {order.createdAt ? (
                            <div className="whitespace-nowrap">
                              <p className="text-sm font-medium" style={{ color: '#3D1A1E' }}>
                                {formatLocalDate(order.createdAt)}
                              </p>
                              <p className="text-[11px] tabular-nums mt-0.5" style={{ color: '#9B7B80' }}>
                                {formatLocalTime(order.createdAt)}
                              </p>
                            </div>
                          ) : <span className="text-sm text-gray-400">—</span>}
                        </td>

                        {/* Items Ordered — one card per item */}
                        <td style={{ minWidth: 320 }}>
                          {(!order.items || order.items.length === 0) ? (
                            <span className="text-xs" style={{ color: '#C4A0A6' }}>—</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {order.items.map((item, idx) => {
                                const iStatus = item.itemStatus || 'PENDING'
                                const iCfg   = STATUS_CONFIG[iStatus] || STATUS_CONFIG.PENDING
                                const isFinal = iStatus === 'CONFIRMED' || iStatus === 'CANCELLED'
                                return (
                                  <div
                                    key={item.id ?? idx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 10,
                                      padding: '7px 10px',
                                      borderRadius: 10,
                                      background: '#fff',
                                      border: '1px solid #F0DDE0',
                                    }}
                                  >
                                    {/* Image */}
                                    <div style={{
                                      width: 40, height: 40, borderRadius: 8, overflow: 'hidden',
                                      border: '1px solid #EDD8DC', background: '#FDF0F2', flexShrink: 0,
                                    }}>
                                      {item.productImage
                                        ? <img src={item.productImage} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#C4A0A6' }}>—</div>
                                      }
                                    </div>

                                    {/* Name + details */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      {/* Name + qty */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#3D1A1E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                                          {item.productName || '—'}
                                        </span>
                                        <span style={{ fontSize: 10, fontWeight: 500, color: '#9B7B80', flexShrink: 0 }}>
                                          ×{item.quantity ?? 1}
                                        </span>
                                      </div>
                                      {/* Size + color */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                        {item.size && (
                                          <span style={{ fontSize: 10, color: '#9B7B80' }}>Size: <strong style={{ color: '#6B1F2A' }}>{item.size}</strong></span>
                                        )}
                                        {item.color && (
                                          <span
                                            title={item.color}
                                            style={{
                                              display: 'inline-block', width: 13, height: 13,
                                              borderRadius: '50%', flexShrink: 0,
                                              backgroundColor: resolveColor(item.color) ?? item.color,
                                              border: '1.5px solid rgba(0,0,0,0.18)',
                                            }}
                                          />
                                        )}
                                      </div>
                                    </div>

                                    {/* Per-item status */}
                                    <div style={{ flexShrink: 0 }}>
                                      {isFinal ? (
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', gap: 4,
                                          fontSize: 10, fontWeight: 700, padding: '3px 8px',
                                          borderRadius: 8, whiteSpace: 'nowrap',
                                          background: iCfg.bg, color: iCfg.text,
                                          border: `1px solid ${iCfg.border}`,
                                        }}>
                                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: iCfg.dot, flexShrink: 0 }} />
                                          {iStatus}
                                        </span>
                                      ) : (
                                        <select
                                          value={iStatus}
                                          onChange={e => handleItemStatusChange(order.id, item.id, e.target.value)}
                                          disabled={updatingItem === item.id || order.isArchived}
                                          style={{
                                            fontSize: 10, fontWeight: 700, padding: '3px 6px',
                                            borderRadius: 8, outline: 'none', cursor: 'pointer',
                                            background: iCfg.bg, color: iCfg.text,
                                            border: `1px solid ${iCfg.border}`,
                                            opacity: updatingItem === item.id ? 0.5 : 1,
                                          }}
                                        >
                                          {ALL_STATUSES.map(s => (
                                            <option key={s} value={s} style={{ background: '#fff', color: '#374151' }}>{s}</option>
                                          ))}
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            <button
                              type="button"
                              onClick={() => setExpanded(isOpen ? null : order.id)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                              title={t('admin.viewDetails') || 'View'}
                              aria-label="View"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} style={{ color: '#6B1F2A' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            {canArchive && (
                              <button
                                type="button"
                                onClick={() => handleArchive(order.id)}
                                disabled={archiving === order.id}
                                className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-50"
                                title={t('admin.archive')}
                                aria-label="Archive"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} style={{ color: '#6B4E53' }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setConfirmDelete(order)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                              title={t('admin.deleteOrder')}
                              aria-label="Delete"
                            >
                              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0, background: '#FDFBFC' }}>
                            <OrderDetail
                              order={order}
                              updating={updating}
                              onStatusChange={handleStatusChange}
                              onArchive={handleArchive}
                              archiving={archiving}
                              onItemStatusChange={handleItemStatusChange}
                              updatingItem={updatingItem}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

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
        </>
      )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title={t('admin.deleteOrder')}
        message={t('admin.deleteOrderConfirm')}
        itemName={confirmDelete ? `#${confirmDelete.id}` : ''}
        confirmLabel={t('admin.delete') || 'Delete'}
        cancelLabel={t('common.cancel') || 'Cancel'}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
