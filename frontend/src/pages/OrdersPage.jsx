import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrders } from '../api/orderApi'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useLanguage } from '../context/LanguageContext'
import { useFormatPrice } from '../utils/formatPrice'
import Spinner from '../components/ui/Spinner'

const STATUS_STYLES = {
  PENDING:   { dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50  border-amber-200' },
  CONFIRMED: { dot: 'bg-blue-400',  text: 'text-blue-700',  bg: 'bg-blue-50   border-blue-200' },
  CANCELLED: { dot: 'bg-red-400',   text: 'text-red-700',   bg: 'bg-red-50    border-red-200' },
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F9EEF0] flex items-center justify-center mb-6 animate-fade-in-scale">
            <svg className="w-9 h-9 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-[#3D1A1E] mb-2 animate-fade-in-up" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('auth.signIn')}
          </h2>
          <p className="text-sm text-[#9B7B80] mb-8 animate-fade-in-up delay-100 tracking-wide max-w-xs">
            {t('orders.noOrdersSub')}
          </p>
          <div className="flex gap-3 animate-fade-in-up delay-200">
            <button
              type="button"
              onClick={openLogin}
              className="px-7 py-3.5 bg-[#6B1F2A] text-white text-xs font-semibold tracking-[0.15em] uppercase rounded-xl hover:bg-[#7D2432] transition-all shadow-sm"
            >
              {t('auth.signIn')}
            </button>
            <Link
              to="/products"
              className="px-7 py-3.5 border border-[#EDD8DC] text-[#6B1F2A] text-xs font-semibold tracking-[0.15em] uppercase rounded-xl hover:bg-[#FDF0F2] transition-all"
            >
              {t('home.shopNow')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-light text-[#3D1A1E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t('orders.title')}
        </h1>
        {orders.length > 0 && (
          <p className="text-xs text-[#9B7B80] mt-1 tracking-wider">{orders.length} {t('orders.orderNumber')}</p>
        )}
        <div className="h-0.5 w-12 mt-2" style={{ background: 'linear-gradient(90deg, #DFA3AD, transparent)' }} />
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F9EEF0] flex items-center justify-center mb-6 animate-fade-in-scale">
            <svg className="w-9 h-9 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-[#3D1A1E] mb-2 animate-fade-in-up" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('orders.noOrders')}
          </h2>
          <p className="text-sm text-[#9B7B80] mb-8 animate-fade-in-up delay-100 tracking-wide">
            {t('orders.noOrdersSub')}
          </p>
          <Link
            to="/products"
            className="animate-fade-in-up delay-200 inline-flex items-center gap-2 px-7 py-3.5 bg-[#6B1F2A] text-white text-xs font-semibold tracking-[0.15em] uppercase rounded-xl hover:bg-[#7D2432] transition-all shadow-sm shadow-[#6B1F2A]/25 hover:shadow-md hover:shadow-[#6B1F2A]/30"
          >
            {t('home.shopNow')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, idx) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="group block bg-white rounded-2xl p-5 transition-all duration-250 hover:-translate-y-0.5 animate-fade-in-up"
              style={{
                boxShadow: '0 2px 16px rgba(107,31,42,0.06)',
                border: '1px solid #F5E0E3',
                animationDelay: `${idx * 50}ms`,
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <span className="text-sm font-medium text-[#3D1A1E] tracking-wide">
                      {t('orders.orderNumber')} #{order.id}
                    </span>
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
                  <p
                    className="font-light text-[#6B1F2A]"
                    style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}
                  >
                    {formatPrice(order.totalAmount)}
                  </p>
                  <p className="text-[10px] text-[#9B7B80] mt-0.5 flex items-center justify-end gap-0.5 group-hover:text-[#6B1F2A] transition-colors tracking-wide">
                    {t('orders.viewDetails')}
                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </p>
                </div>
              </div>

              {/* Item thumbnails */}
              {order.items?.length > 0 && (
                <div className="flex items-center gap-2">
                  {order.items.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="w-11 h-11 bg-[#F9EEF0] rounded-xl overflow-hidden border border-[#F0D5D8] shrink-0"
                    >
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
  )
}
