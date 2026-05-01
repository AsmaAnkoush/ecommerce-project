import { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getOrder } from '../api/orderApi'
import { useLanguage } from '../context/LanguageContext'
import { useFormatPrice } from '../utils/formatPrice'
import { formatShortDateTime } from '../utils/dateUtils'
import Spinner from '../components/ui/Spinner'

const CARD_BASE = 'bg-white border border-[#F0D5D8] rounded-2xl'
const CARD_SHADOW = { boxShadow: '0 2px 12px rgba(107,31,42,0.05)' }
const PRIMARY_BTN = 'btn-primary-pill'

const STATUS_STEPS = ['PENDING', 'CONFIRMED']

const STATUS_STYLES = {
  PENDING:   { bg: 'bg-amber-50',    text: 'text-amber-700',    ring: 'ring-amber-200' },
  CONFIRMED: { bg: 'bg-emerald-50',  text: 'text-emerald-700',  ring: 'ring-emerald-200' },
  CANCELLED: { bg: 'bg-red-50',      text: 'text-red-700',      ring: 'ring-red-200' },
}

function PageHero({ icon, title, subtitle }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FDF6F7] to-[#F5E1E5]" />
      <div className="absolute -top-20 -end-20 w-56 h-56 rounded-full bg-[#DFA3AD] opacity-15 blur-3xl" />
      <div className="absolute -bottom-16 -start-16 w-64 h-64 rounded-full bg-[#E8B4BC] opacity-10 blur-3xl" />
      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-10 text-center flex flex-col items-center gap-2">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-[0_3px_12px_rgba(107,31,42,0.1)]">
          <svg className="w-[18px] h-[18px] text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-[#6B1F2B] tracking-[0.04em] sm:tracking-[0.06em] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
          {title}
        </h1>
        <span className="inline-block h-px w-12 bg-gradient-to-r from-transparent via-[#DFA3AD] to-transparent" />
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#9B7B80] max-w-md mx-auto leading-relaxed font-light">{subtitle}</p>
        )}
      </div>
    </section>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const fromCheckout = location.state?.fromCheckout

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrder(id)
      .then((res) => setOrder(res.data.data ?? null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-40"><Spinner size="lg" /></div>
  if (!order) return (
    <div className="bg-[#FDF6F7] min-h-screen">
      <PageHero
        icon="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        title={t('admin.orderNotFound')}
      />
      <div className="max-w-md mx-auto px-4 py-10 text-center">
        <Link to="/products" className={`${PRIMARY_BTN} w-full sm:w-auto`}>
          {t('home.shopNow')}
          <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  )

  const currentStep = STATUS_STEPS.indexOf(order.status)
  const isConfirmed = order.status === 'CONFIRMED'
  const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.PENDING

  return (
    <div className="bg-[#FDF6F7] min-h-screen">
      <PageHero
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        title={t('orders.orderDetails')}
        subtitle={`${t('orders.placedOn')} ${formatShortDateTime(order.createdAt)}`}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-6">

        {/* Success banner (card) */}
        {fromCheckout && (
          <div className={`card-hover ${CARD_BASE} hover:border-emerald-200 px-5 py-4 flex items-start gap-4 animate-fade-in-up`} style={CARD_SHADOW}>
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[#3D1A1E] text-base" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t('orders.orderPlaced')}
              </p>
              <p className="text-xs sm:text-sm text-[#9B7B80] mt-0.5 font-light">{t('orders.orderPlacedDesc')}</p>
            </div>
          </div>
        )}

        {/* Status row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-[#9B7B80] tracking-wide">
            {t('orders.placedOn')} {formatShortDateTime(order.createdAt)}
          </p>
          <span className={[
            'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-[0.12em] uppercase ring-1',
            statusStyle.bg, statusStyle.text, statusStyle.ring,
          ].join(' ')}>
            {isConfirmed && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {t('status.' + order.status)}
          </span>
        </div>

        {/* Progress card */}
        {order.status !== 'CANCELLED' && (
          <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] p-6 sm:p-8`} style={CARD_SHADOW}>
            <h2 className="text-xs font-semibold text-[#6B1F2A] mb-8 uppercase tracking-[0.18em] text-center">
              {t('orders.orderProgress')}
            </h2>
            <div className="px-2 sm:px-4 py-3">
              <div className="flex items-start max-w-md mx-auto">
                {STATUS_STEPS.map((step, i) => {
                  const reached = i <= currentStep
                  const isCurrent = i === currentStep
                  return (
                    <div key={step} className={`flex items-start ${i < STATUS_STEPS.length - 1 ? 'flex-1' : ''}`}>
                      <div className="flex flex-col items-center shrink-0 w-20 sm:w-24">
                        <div className={[
                          'w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ease-out shrink-0',
                          reached ? 'bg-[#6B1F2A] text-white shadow-[0_4px_14px_rgba(107,31,42,0.3)]' : 'bg-[#F9EEF0] text-[#C4A0A6]',
                          isCurrent && isConfirmed ? 'ring-4 ring-emerald-200' : '',
                          isCurrent && !isConfirmed ? 'ring-4 ring-[#F0D5D8]' : '',
                        ].join(' ')}>
                          {i < currentStep || (i === currentStep && isConfirmed) ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            i + 1
                          )}
                        </div>
                        <p className={[
                          'text-[11px] sm:text-xs mt-3 text-center leading-tight tracking-wide',
                          reached ? 'text-[#6B1F2A] font-semibold' : 'text-[#9B7B80]',
                        ].join(' ')}>
                          {t('status.' + step)}
                        </p>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className="flex-1 h-1 mt-[22px] sm:mt-[24px] rounded-full bg-[#F9EEF0] overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#6B1F2A] to-[#8B2535] transition-all duration-700 ease-out" style={{ width: i < currentStep ? '100%' : '0%' }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Items card */}
        <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] p-6 sm:p-8`} style={CARD_SHADOW}>
          <h2 className="text-xs font-semibold text-[#6B1F2A] mb-6 uppercase tracking-[0.18em]">
            {t('orders.itemsOrdered')}
          </h2>
          <div className="divide-y divide-[#F5E0E3]">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 sm:gap-5 items-center py-4 sm:py-5 first:pt-0 last:pb-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#FDF0F2] to-[#F5DCE0] rounded-2xl overflow-hidden shrink-0 border border-[#F0D5D8]">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#DFA3AD] text-xs">—</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#3D1A1E] leading-snug line-clamp-2" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '17px' }}>
                    {item.productName}
                  </p>
                  {(item.size || item.color) && (
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#6B4E53]">
                      {item.size && (
                        <span className="inline-flex items-center gap-1 bg-[#FDF6F7] border border-[#F0D5D8] rounded-md px-2 py-0.5">
                          <span className="text-[10px] text-[#9B7B80] uppercase tracking-wide">{t('product.size') || 'Size'}</span>
                          <span className="font-medium text-[#3D1A1E]">{item.size}</span>
                        </span>
                      )}
                      {item.color && (
                        <span className="inline-flex items-center gap-1.5 bg-[#FDF6F7] border border-[#F0D5D8] rounded-md px-2 py-0.5">
                          <span className="text-[10px] text-[#9B7B80] uppercase tracking-wide">{t('product.color') || 'Color'}</span>
                          <span
                            className="inline-block w-3.5 h-3.5 rounded-full border border-[#E5DDE0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
                            style={{ backgroundColor: item.color }}
                            aria-label={item.color}
                            title={item.color}
                          />
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-[#9B7B80] mt-2 tracking-wide">
                    <span className="font-semibold text-[#6B3840]">{item.quantity}×</span>
                  </p>
                </div>
                <p className="font-bold text-[#6B1F2A] shrink-0" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}>
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#F0D5D8] mt-6 pt-6 flex justify-between items-center">
            <span className="text-xs font-semibold text-[#6B1F2A] uppercase tracking-[0.18em]">{t('orders.total')}</span>
            <span className="font-bold text-[#6B1F2A]" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px' }}>
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Shipping & Contact grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] p-6`} style={CARD_SHADOW}>
            <h3 className="text-[10px] font-semibold text-[#6B1F2A] uppercase tracking-[0.18em] mb-3">
              {t('orders.shippingAddress')}
            </h3>
            <p className="text-sm text-[#3D1A1E] leading-relaxed">{order.shippingAddress}</p>
          </div>
          <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] p-6`} style={CARD_SHADOW}>
            <h3 className="text-[10px] font-semibold text-[#6B1F2A] uppercase tracking-[0.18em] mb-3">
              {t('orders.contact')}
            </h3>
            {order.customerPhone ? (
              <div className="flex items-center gap-2.5">
                <p className="text-sm text-[#3D1A1E]">{order.customerPhone}</p>
                <a
                  href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:scale-110 transition-all duration-200 shrink-0 shadow-md shadow-emerald-500/30"
                  title={t('orders.openWhatsApp')}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            ) : (
              <p className="text-sm text-[#C4A0A6]">—</p>
            )}
            {order.trackingNumber && (
              <p className="text-xs text-[#9B7B80] mt-3">
                {t('orders.tracking')}: <span className="font-medium text-[#6B3840]">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-6 border-t border-[#F0D5D8]">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
            <Link
              to="/orders"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-full border border-[#6B1F2A]/25 bg-white text-[#6B1F2A] text-xs font-semibold uppercase tracking-[0.15em] hover:border-[#6B1F2A] hover:bg-[#FDF0F2] active:scale-95 transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5 rtl:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('orders.backToOrders')}
            </Link>
            <Link
              to="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-full bg-[#6B1F2A] text-white text-xs font-semibold uppercase tracking-[0.15em] hover:bg-[#551820] hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
            >
              {t('orders.continueShopping')}
              <svg className="w-3.5 h-3.5 rtl:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
