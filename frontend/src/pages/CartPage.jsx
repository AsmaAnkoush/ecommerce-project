import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useFormatPrice } from '../utils/formatPrice'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Spinner size="lg" />
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-[#F9EEF0] flex items-center justify-center mb-6 animate-fade-in-scale">
          <svg className="w-9 h-9 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2
          className="text-3xl font-light text-[#3D1A1E] mb-2 animate-fade-in-up"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          {t('cart.empty')}
        </h2>
        <p className="text-sm text-[#9B7B80] mb-8 animate-fade-in-up delay-100 tracking-wide">
          {t('cart.emptySub')}
        </p>
        <Button size="lg" onClick={() => navigate('/products')} className="animate-fade-in-up delay-200">
          {t('home.shopNow')}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-3xl sm:text-4xl font-light text-[#3D1A1E]"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          {t('cart.title')}
        </h1>
        <p className="text-xs text-[#9B7B80] mt-1 tracking-wider">
          {cart.totalItems} {cart.totalItems === 1 ? t('cart.piece') : t('cart.pieces')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Items list ────────────────────────────────────── */}
        <div className="flex-1 space-y-3">
          {cart.items.map((item, idx) => (
            <div
              key={item.id}
              className="flex gap-4 bg-white rounded-2xl p-4 animate-fade-in-up"
              style={{
                boxShadow: '0 2px 16px rgba(107,31,42,0.06)',
                animationDelay: `${idx * 60}ms`,
              }}
            >
              {/* Product image */}
              <Link
                to={`/products/${item.productId}`}
                className="w-20 h-24 sm:w-24 sm:h-28 bg-[#F9EEF0] rounded-xl overflow-hidden shrink-0 hover:opacity-90 transition-opacity"
              >
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#DFA3AD]">
                    <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <Link
                    to={`/products/${item.productId}`}
                    className="text-sm font-light text-[#3D1A1E] hover:text-[#6B1F2A] line-clamp-2 transition-colors leading-snug"
                    style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px' }}
                  >
                    {item.productName}
                  </Link>
                  {(item.color || item.size) && (
                    <p className="text-[10px] text-[#9B7B80] mt-1 tracking-wide">
                      {[item.color, item.size].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-xs text-[#9B7B80] mt-1">{formatPrice(item.unitPrice)} {t('cart.perItem')}</p>
                </div>

                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  {/* Quantity control */}
                  <div className="flex items-center border border-[#EDD8DC] rounded-xl overflow-hidden">
                    <button
                      onClick={() => updateItem(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#F9EEF0] transition-colors text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="px-3 text-sm font-semibold text-[#3D1A1E] min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#F9EEF0] transition-colors text-lg leading-none"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <p
                      className="font-light text-[#6B1F2A] text-lg"
                      style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}
                    >
                      {formatPrice(item.subtotal)}
                    </p>
                    <button
                      onClick={() => removeItem(item.cartItemId ?? item.id)}
                      className="w-8 h-8 flex items-center justify-center text-[#C4A0A6] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                      title={t('cart.delete')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Order summary ─────────────────────────────────── */}
        <div className="w-full lg:w-[300px] xl:w-[320px] shrink-0">
          <div
            className="bg-white rounded-2xl p-6 lg:sticky lg:top-24"
            style={{ boxShadow: '0 2px 20px rgba(107,31,42,0.07)' }}
          >
            <h2
              className="font-light text-[#3D1A1E] mb-5 pb-4 border-b border-[#F0D5D8]"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}
            >
              {t('cart.orderSummary')}
            </h2>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between text-[#9B7B80]">
                <span>{t('cart.subtotal')} ({cart.totalItems} {t('cart.pieces')})</span>
                <span>{formatPrice(cart.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-[#9B7B80]">
                <span>{t('cart.delivery')}</span>
                <span className="text-emerald-600 font-medium text-xs tracking-wide">{t('cart.free')}</span>
              </div>
              <div className="pt-3 border-t border-[#F0D5D8] flex justify-between items-center">
                <span className="font-medium text-[#3D1A1E] tracking-wide text-xs uppercase">{t('cart.total')}</span>
                <span
                  className="font-light text-[#6B1F2A]"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}
                >
                  {formatPrice(cart.totalPrice)}
                </span>
              </div>
            </div>

            <Button size="lg" className="w-full mt-6" onClick={() => navigate('/checkout')}>
              {t('cart.completeOrder')}
            </Button>
            <button
              onClick={() => navigate('/products')}
              className="w-full mt-3 py-2.5 text-xs text-[#9B7B80] hover:text-[#6B1F2A] tracking-[0.12em] uppercase transition-colors text-center"
            >
              {t('cart.continueShopping')}
            </button>

            {/* Trust badges */}
            <div className="mt-6 pt-5 border-t border-[#F9E8EB] flex items-center justify-around">
              {[
                { icon: '🔒', label: t('cart.securePayment') },
                { icon: '🚚', label: t('cart.fastDelivery') },
                { icon: '↩️', label: t('cart.freeReturns') },
              ].map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-lg">{icon}</span>
                  <span className="text-[9px] tracking-wide text-[#9B7B80]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
