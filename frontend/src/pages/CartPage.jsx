import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useFormatPrice } from '../utils/formatPrice'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'

const CARD_BASE = 'bg-white border border-[#F0D5D8] rounded-2xl'
const CARD_SHADOW = { boxShadow: '0 2px 12px rgba(107,31,42,0.05)' }
const PRIMARY_BTN = 'btn-primary-pill'

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

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { toast } = useToast()
  const formatPrice = useFormatPrice()

  // Wrap mutations so the user always gets feedback — the underlying context
  // calls are silent so they can be reused by other surfaces (ProductCard etc.).
  const handleQtyChange = async (itemId, nextQty) => {
    try {
      await updateItem(itemId, nextQty)
      if (nextQty <= 0) toast(t('cart.removedToast'))
      else              toast(t('cart.updatedToast'))
    } catch (err) {
      toast(err?.response?.data?.message || t('cart.updateFailed'), 'error')
    }
  }
  const handleRemove = async (itemId) => {
    try {
      await removeItem(itemId)
      toast(t('cart.removedToast'))
    } catch (err) {
      toast(err?.response?.data?.message || t('cart.removeFailed'), 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Spinner size="lg" />
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="bg-[#FDF6F7] min-h-screen">
        <PageHero
          icon="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          title={t('cart.empty')}
          subtitle={t('cart.emptySub')}
        />
        <div className="max-w-md mx-auto px-4 py-10">
          <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] px-6 py-10 flex flex-col items-center text-center gap-4`} style={CARD_SHADOW}>
            <div className="w-14 h-14 rounded-full bg-[#FDF0F2] flex items-center justify-center">
              <svg className="w-7 h-7 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-[#9B7B80] font-light leading-relaxed">{t('cart.emptySub')}</p>
            <button onClick={() => navigate('/products')} className={`${PRIMARY_BTN} w-full sm:w-auto mt-2`}>
              {t('home.shopNow')}
              <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#FDF6F7] min-h-screen">
      <PageHero
        icon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        title={t('cart.title')}
        count={cart.totalItems}
        countLabel={cart.totalItems === 1 ? t('cart.piece') : t('cart.pieces')}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

          {/* ── Items list ────────────────────────────────────── */}
          <div className="md:col-span-2 space-y-4">
            {cart.items.map((item, idx) => (
              <div
                key={item.id}
                className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] flex gap-4 p-4 animate-fade-in-up`}
                style={{ ...CARD_SHADOW, animationDelay: `${idx * 60}ms` }}
              >
                <Link
                  to={`/products/${item.productId}`}
                  className="w-20 h-24 sm:w-24 sm:h-28 bg-[#F9EEF0] rounded-xl overflow-hidden shrink-0 hover:opacity-90 transition-opacity border border-[#F0D5D8]"
                >
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#DFA3AD]">
                      <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                    </div>
                  )}
                </Link>

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
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#9B7B80] tracking-wide">
                        {item.color && (
                          <span
                            className="inline-block w-4 h-4 rounded-full border border-[#D9CDD0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
                            style={{ backgroundColor: item.color }}
                            aria-label={item.color}
                            title={item.color}
                          />
                        )}
                        {item.color && item.size && <span className="text-[#DEB8BE]">·</span>}
                        {item.size && <span>{item.size}</span>}
                      </div>
                    )}
                    <p className="text-xs text-[#9B7B80] mt-1">{formatPrice(item.unitPrice)} {t('cart.perItem')}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <div className="flex items-center border border-[#EDD8DC] rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => handleQtyChange(item.cartItemId ?? item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors text-lg leading-none"
                      >
                        −
                      </button>
                      <span className="px-3 text-sm font-semibold text-[#3D1A1E] min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(item.cartItemId ?? item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors text-lg leading-none"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="font-light text-[#6B1F2A]" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}>
                        {formatPrice(item.subtotal)}
                      </p>
                      <button
                        onClick={() => handleRemove(item.cartItemId ?? item.id)}
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
          <div className="md:col-span-1">
            <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] p-6 md:sticky md:top-24`} style={CARD_SHADOW}>
              <h2 className="text-base sm:text-lg font-medium text-[#6B1F2B] tracking-[0.04em] mb-5 pb-4 border-b border-[#F0D5D8]" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t('cart.orderSummary')}
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#9B7B80]">
                  <span>{t('cart.subtotal')} ({cart.totalItems} {t('cart.pieces')})</span>
                  <span className="nums-normal">{formatPrice(cart.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-[#9B7B80]">
                  <span>{t('cart.delivery')}</span>
                  <span className="text-emerald-600 font-medium text-xs tracking-wide">{t('cart.free')}</span>
                </div>
                <div className="pt-3 border-t border-[#F0D5D8] flex justify-between items-center">
                  <span className="font-medium text-[#3D1A1E] tracking-wide text-xs uppercase">{t('cart.total')}</span>
                  <span className="font-light text-[#6B1F2A] nums-normal" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}>
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

              <div className="mt-6 pt-5 border-t border-[#F9E8EB] grid grid-cols-3 gap-2">
                {[
                  { icon: '🔒', label: t('cart.securePayment') },
                  { icon: '🚚', label: t('cart.fastDelivery') },
                  { icon: '↩️', label: t('cart.freeReturns') },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <span className="text-lg">{icon}</span>
                    <span className="text-[9px] tracking-wide text-[#9B7B80] text-center">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
