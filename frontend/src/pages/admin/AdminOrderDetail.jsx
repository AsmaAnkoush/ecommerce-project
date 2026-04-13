import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAdminOrder, updateOrderStatus } from '../../api/adminApi'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import PageHeader from '../../components/layout/PageHeader'
import { useFormatPrice } from '../../utils/formatPrice'
import { useLanguage } from '../../context/LanguageContext'

const STATUS_VARIANT = { PENDING: 'warning', CONFIRMED: 'info', CANCELLED: 'danger' }
const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED']
const STATUS_STEPS = ['PENDING', 'CONFIRMED']

export default function AdminOrderDetail() {
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [statusSuccess, setStatusSuccess] = useState(false)

  useEffect(() => {
    getAdminOrder(id)
      .then(res => setOrder(res.data?.data ?? null))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (status) => {
    if (status === order.status) return
    setUpdating(true)
    try {
      await updateOrderStatus(order.id, status)
      setOrder(o => ({ ...o, status }))
      setStatusSuccess(true)
      setTimeout(() => setStatusSuccess(false), 2500)
    } finally { setUpdating(false) }
  }

  if (loading) return <div className="flex justify-center py-40"><Spinner size="lg" /></div>
  if (!order) return <div className="p-8 text-gray-500">{t('admin.orderNotFound')}</div>

  const currentStep = STATUS_STEPS.indexOf(order.status)
  const buildWaMessage = () => {
    const first = order.items?.[0] || {}
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
  const whatsappLink = order.customerPhone
    ? `https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(buildWaMessage())}`
    : null

  return (
    <div>
      <PageHeader />
      <div className="p-6 max-w-4xl pt-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/orders" className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.order')} #{order.id}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(order.createdAt).toLocaleString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
            {order.isGuest && <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t('admin.guest')}</span>}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status] || 'default'}>{order.status}</Badge>
      </div>

      {/* Progress tracker */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">{t('admin.orderProgress')}</h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i <= currentStep ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < currentStep
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      : i + 1}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 w-16 text-center leading-tight">{step}</p>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${i < currentStep ? 'bg-gray-900' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Items — takes 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">{t('admin.itemsOrdered')}</h2>
            </div>

            <div className="divide-y divide-gray-50">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-4 px-5 py-4">
                  {/* Image — variant-specific when available, with a small color-dot overlay */}
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                    {item.productImage
                      ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                    }
                    {item.color && (
                      <span
                        className="absolute bottom-1 end-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: item.color }}
                        aria-label={item.color}
                        title={item.color}
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{item.productName}</p>

                    {/* Variant chips */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                        <span className="text-gray-400 text-[10px] uppercase tracking-wide">{t('admin.SIZE')}</span>
                        <span className="font-medium">{item.size || '—'}</span>
                      </span>
                      {item.color && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                          <span className="text-gray-400 text-[10px]">{t('admin.COLOR')}</span>
                          <span
                            className="inline-block w-3.5 h-3.5 rounded-full border border-gray-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
                            style={{ backgroundColor: item.color }}
                            aria-label={item.color}
                            title={item.color}
                          />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                      <p className="font-bold text-gray-900 text-sm">{formatPrice(item.subtotal)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total row */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between font-bold text-gray-900 text-sm">
              <span>{order.items.reduce((s, i) => s + i.quantity, 0)} {t('admin.items')}</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{t('admin.customer')}</h2>
            <p className="font-semibold text-gray-900 text-sm">{order.customerName || '—'}</p>
            {order.customerPhone && (
              <p className="text-sm text-gray-600 mt-1">{order.customerPhone}</p>
            )}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t('admin.sendMessage')}
              </a>
            )}
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{t('admin.shipping')}</h2>
            <p className="text-sm text-gray-800">{order.shippingAddress}</p>
            {order.city && <p className="text-sm text-gray-500 mt-0.5">{order.city}</p>}
            {order.trackingNumber && (
              <p className="text-xs text-gray-400 mt-2">{t('orders.tracking')}: <span className="font-medium text-gray-700">{order.trackingNumber}</span></p>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-2">{t('admin.customerNotes')}</h2>
              <p className="text-sm text-amber-800">{order.notes}</p>
            </div>
          )}

          {/* Payment */}
          {order.paymentMethod && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{t('admin.payment')}</h2>
              <p className="text-sm text-gray-800">{order.paymentMethod}</p>
            </div>
          )}

          {/* Status update */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{t('admin.updateStatus')}</h2>
            <select
              value={order.status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={updating}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400 bg-white disabled:opacity-60"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {updating && <p className="text-xs text-gray-400 mt-2">{t('admin.updating')}</p>}
            {statusSuccess && (
              <p className="text-xs text-green-600 mt-2 font-medium">{t('admin.statusUpdated')}</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
