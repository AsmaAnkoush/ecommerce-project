import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import { useFormatPrice } from '../../utils/formatPrice'
import { useUI } from '../../context/UIContext'

/**
 * Slide-in cart drawer (right side in LTR, left in RTL).
 *
 * Controlled via UIContext: `openCart()` / `closeCart()`.
 * Shows cart items with quantity controls, total price, and a checkout CTA.
 * Closes on backdrop click, ESC, or the X button.
 */
export default function CartDrawer() {
  const { cartDrawerOpen, closeCart } = useUI()
  const { cart, updateItem, removeItem } = useCart()
  const { t, isRTL } = useLanguage()
  const formatPrice = useFormatPrice()

  useEffect(() => {
    if (!cartDrawerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') closeCart() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cartDrawerOpen, closeCart])

  useEffect(() => {
    if (!cartDrawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [cartDrawerOpen])

  if (!cartDrawerOpen) return null

  const sideAnchor   = isRTL ? 'left-0' : 'right-0'
  const slideAnim    = isRTL ? 'animate-drawer-left' : 'animate-drawer-right'
  const innerRounded = isRTL ? 'md:rounded-r-3xl' : 'md:rounded-l-3xl'

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <div onClick={closeCart} className="absolute inset-0 bg-[#3D1A1E]/45 backdrop-blur-sm animate-fade-in" />

      <div className={[
        'absolute inset-y-0', sideAnchor,
        'w-full md:w-[420px] bg-[#FDF6F7]',
        'shadow-[0_10px_60px_rgba(107,31,42,0.25)]',
        innerRounded, slideAnim,
        'flex flex-col overflow-hidden',
      ].join(' ')}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0D5D8]">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs tracking-[0.18em] uppercase text-[#6B1F2A] font-semibold">
              {t('cart.title')}
            </span>
            {cart.totalItems > 0 && (
              <span className="text-[10px] bg-[#6B1F2A] text-white px-2 py-0.5 rounded-full font-bold">
                {cart.totalItems}
              </span>
            )}
          </div>
          <button type="button" onClick={closeCart} aria-label={t('common.close')}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-[#F0D5D8] flex items-center justify-center text-[#9B7B80] hover:text-[#6B1F2A] transition-all active:scale-95 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <svg className="w-12 h-12 text-[#DFA3AD] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-sm text-[#9B7B80]">{t('cart.empty')}</p>
              <Link to="/products" onClick={closeCart}
                className="mt-4 text-xs text-[#6B1F2A] font-semibold underline underline-offset-2 decoration-[#DFA3AD] hover:text-[#8B2535] transition-colors">
                {t('cart.continueShopping')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map(item => (
                <div key={item.id} className="flex gap-3 bg-white rounded-2xl p-3 border border-[#F5E0E3] shadow-[0_1px_6px_rgba(107,31,42,0.04)]">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F9F0F1] shrink-0">
                    {item.productImage && <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#3D1A1E] line-clamp-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      {item.productName}
                    </p>
                    <p className="text-xs text-[#9B7B80] mt-0.5">{formatPrice(item.unitPrice)}</p>
                    {(item.size || item.color) && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.size && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FDF0F2] text-[#9B7B80] border border-[#F0D5D8]">{item.size}</span>}
                        {item.color && (
                          <span
                            className="inline-block w-4 h-4 rounded-full border border-[#D9CDD0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
                            style={{ backgroundColor: item.color }}
                            aria-label={item.color}
                            title={item.color}
                          />
                        )}
                      </div>
                    )}
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateItem(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg border border-[#EDD8DC] flex items-center justify-center text-[#9B7B80] hover:text-[#6B1F2A] hover:border-[#DFA3AD] transition-colors text-xs">−</button>
                      <span className="text-xs font-semibold text-[#3D1A1E] w-5 text-center tabular-nums">{item.quantity}</span>
                      <button onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg border border-[#EDD8DC] flex items-center justify-center text-[#9B7B80] hover:text-[#6B1F2A] hover:border-[#DFA3AD] transition-colors text-xs">+</button>
                      <button onClick={() => removeItem(item.cartItemId ?? item.id)}
                        className="ms-auto text-[#C4A0A6] hover:text-red-500 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with total + checkout */}
        {cart.items.length > 0 && (
          <div className="border-t border-[#F0D5D8] px-5 py-4 space-y-3 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9B7B80] uppercase tracking-[0.15em]">{t('cart.total')}</span>
              <span className="text-lg font-semibold text-[#6B1F2A] nums-normal" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {formatPrice(cart.totalPrice)}
              </span>
            </div>
            <Link to="/checkout" onClick={closeCart}
              className="block w-full text-center bg-[#6B1F2A] text-white py-3.5 rounded-xl text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#7D2432] transition-colors shadow-sm shadow-[#6B1F2A]/20">
              {t('cart.checkout')}
            </Link>
            <Link to="/cart" onClick={closeCart}
              className="block text-center text-[10px] text-[#9B7B80] hover:text-[#6B1F2A] tracking-wide transition-colors underline underline-offset-2 decoration-[#DFA3AD]">
              {t('cart.continueShopping')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
