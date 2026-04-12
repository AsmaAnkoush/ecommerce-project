import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrders } from '../api/orderApi'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useLanguage } from '../context/LanguageContext'
import { useFormatPrice } from '../utils/formatPrice'
import Spinner from '../components/ui/Spinner'

const CARD_BASE = 'bg-white border border-[#F0D5D8] rounded-2xl'
const CARD_SHADOW = { boxShadow: '0 2px 12px rgba(107,31,42,0.05)' }
const PRIMARY_BTN = 'inline-flex items-center justify-center gap-2 bg-[#6B1F2A] text-white text-xs font-semibold tracking-[0.2em] uppercase px-9 py-3.5 rounded-full shadow-[0_8px_24px_rgba(107,31,42,0.25)] hover:bg-[#551820] hover:shadow-[0_12px_32px_rgba(107,31,42,0.35)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300'

const STATUS_STYLES = {
  PENDING:   { dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  CONFIRMED: { dot: 'bg-blue-400',  text: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200' },
  CANCELLED: { dot: 'bg-red-400',   text: 'text-red-700',   bg: 'bg-red-50 border-red-200' },
}

function StatusBadge({ status, t }) {
  const cfg = STATUS_STYLES[status] || { dot: 'bg-gray-400', text: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border tracking-wide ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t('status.' + status)}
    </span>
  )
}

function PageHero({ icon, title, subtitle, count, countLabel }) {
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
        {count > 0 && (
          <p className="text-[11px] text-[#9B7B80] tracking-wider nums-normal mt-1">{count} {countLabel}</p>
        )}
      </div>
    </section>
  )
}

export default function OrdersPage() {
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const { isLoggedIn } = useAuth()
  const { openLogin } = useUI()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return }
    getOrders()
      .then((res) => setOrders(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  if (loading) {
    return <div className="flex justify-center items-center py-40"><Spinner size="lg" /></div>
  }

  /* Guest prompt */
  if (!isLoggedIn) {
    return (
      <div className="bg-[#FDF6F7] min-h-screen">
        <PageHero
          icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          title={t('auth.signIn')}
          subtitle={t('orders.noOrdersSub')}
        />
        <div className="max-w-md mx-auto px-4 py-10">
          <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] px-6 py-10 flex flex-col items-center text-center gap-4`} style={CARD_SHADOW}>
            <div className="w-14 h-14 rounded-full bg-[#FDF0F2] flex items-center justify-center">
              <svg className="w-7 h-7 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-[#9B7B80] font-light leading-relaxed">{t('orders.noOrdersSub')}</p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button type="button" onClick={openLogin} className={`${PRIMARY_BTN} w-full sm:w-auto`}>
                {t('auth.signIn')}
              </button>
              <Link to="/products" className="inline-flex items-center justify-center gap-2 border border-[#EDD8DC] text-[#6B1F2A] text-xs font-semibold tracking-[0.2em] uppercase px-9 py-3.5 rounded-full hover:bg-[#FDF0F2] hover:border-[#DFA3AD] transition-all duration-300 w-full sm:w-auto">
                {t('home.shopNow')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#FDF6F7] min-h-screen">
      <PageHero
        icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        title={t('orders.title')}
        count={orders.length}
        countLabel={t('orders.orderNumber')}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {orders.length === 0 ? (
          <div className="max-w-md mx-auto">
            <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] px-6 py-10 flex flex-col items-center text-center gap-4`} style={CARD_SHADOW}>
              <div className="w-14 h-14 rounded-full bg-[#FDF0F2] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-medium text-[#6B1F2B] tracking-[0.04em] mb-1.5" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {t('orders.noOrders')}
                </h2>
                <p className="text-xs sm:text-sm text-[#9B7B80] font-light leading-relaxed">{t('orders.noOrdersSub')}</p>
              </div>
              <Link to="/products" className={`${PRIMARY_BTN} w-full sm:w-auto mt-2`}>
                {t('home.shopNow')}
                <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order, idx) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className={`card-hover group block ${CARD_BASE} hover:border-[#DFA3AD] p-5 animate-fade-in-up`}
                style={{ ...CARD_SHADOW, animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <StatusBadge status={order.status} t={t} />
                    </div>
                    <p className="text-[11px] text-[#9B7B80] tracking-wide">
                      {new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {order.shippingAddress && (
                      <p className="text-[11px] text-[#B08A90] mt-0.5 truncate max-w-xs">
                        📍 {order.shippingAddress}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-light text-[#6B1F2A]" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}>
                      {formatPrice(order.totalAmount)}
                    </p>
                    <p className="text-[10px] text-[#9B7B80] mt-0.5 flex items-center justify-end gap-0.5 group-hover:text-[#6B1F2A] transition-colors tracking-wide">
                      {t('orders.viewDetails')}
                      <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </p>
                  </div>
                </div>

                {order.items?.length > 0 && (
                  <div className="flex items-center gap-2">
                    {order.items.slice(0, 5).map((item) => (
                      <div key={item.id} className="w-11 h-11 bg-[#F9EEF0] rounded-xl overflow-hidden border border-[#F0D5D8] shrink-0">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#DFA3AD]">
                            <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 5 && (
                      <div className="w-11 h-11 bg-[#F9EEF0] rounded-xl flex items-center justify-center text-[10px] text-[#9B7B80] font-semibold border border-[#F0D5D8] shrink-0">
                        +{order.items.length - 5}
                      </div>
                    )}
                    <span className="text-[10px] text-[#9B7B80] ms-1 tracking-wide">
                      {order.items.length} {order.items.length === 1 ? t('cart.piece') : t('cart.pieces')}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
