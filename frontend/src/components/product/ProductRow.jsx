import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useUI } from '../../context/UIContext'
import { useLanguage } from '../../context/LanguageContext'
import { useFormatPrice } from '../../utils/formatPrice'

/**
 * Horizontal product row for the ProductsPage list view.
 *
 * Reuses the same Cart / Wishlist / formatPrice hooks as ProductCard so the
 * behaviour stays identical between grid and list modes (cart updates,
 * wishlist toggle with bump animation, prices in the active language). Only
 * the visual presentation is different.
 */
const CartGlyph = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
)

export default function ProductRow({ product }) {
  const { addToCart } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { openQuickView } = useUI()
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const [adding, setAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [wishBumpKey, setWishBumpKey] = useState(0)

  const inWishlist = isInWishlist(product.id)
  const isOutOfStock = product.stockQuantity === 0
  const hasDiscount = product.discountPrice && product.discountPrice < product.price

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (adding || justAdded || isOutOfStock) return
    if ((product.variants?.length ?? 0) > 1) {
      openQuickView(product)
      return
    }
    try {
      setAdding(true)
      await addToCart(product.id, 1, product)
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
    } finally { setAdding(false) }
  }

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      setToggling(true)
      if (inWishlist) {
        await removeFromWishlist(product.id)
      } else {
        await addToWishlist(product.id, product)
        setWishBumpKey(k => k + 1)
      }
    } finally { setToggling(false) }
  }

  const cartButtonIcon = adding ? (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  ) : justAdded ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
    </svg>
  ) : (
    <CartGlyph className="w-4 h-4" />
  )

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden card-hover"
      style={{ boxShadow: '0 2px 16px rgba(107,31,42,0.06)' }}
    >
      <Link to={`/products/${product.id}`} className="flex items-stretch">

        {/* ── Image (start side) ──────────────────────────── */}
        <div className="relative shrink-0 w-[120px] sm:w-[150px] aspect-square overflow-hidden"
             style={{ background: 'linear-gradient(145deg, #FDF8F9, #F0E4E6)' }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-2 transition-transform duration-500 hover:scale-[1.05]"
              style={{ mixBlendMode: 'multiply' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#DFA3AD]">
              <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              </svg>
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/55 flex items-center justify-center">
              <span className="bg-[#3D1A1E]/75 text-white text-[9px] px-2 py-1 rounded-full tracking-wider backdrop-blur-sm">
                {t('product.outOfStock')}
              </span>
            </div>
          )}
        </div>

        {/* ── Info (end side, fills remaining width) ──────── */}
        <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between gap-3">

          {/* Top: name + heart */}
          <div className="flex items-start justify-between gap-2 min-w-0">
            <h3
              className="text-[#3D1A1E] line-clamp-2 leading-snug min-w-0"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '17px', fontWeight: 500 }}
            >
              {product.name}
            </h3>

            <button
              type="button"
              onClick={handleWishlist}
              disabled={toggling}
              aria-label={inWishlist ? t('product.removeFromWishlist') : t('product.addToWishlist')}
              title={inWishlist ? t('product.removeFromWishlist') : t('product.addToWishlist')}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#FDF0F2] transition-colors active:scale-95"
            >
              <span
                key={`wish-${wishBumpKey}`}
                className={wishBumpKey > 0 ? 'inline-flex animate-heartbeat' : 'inline-flex'}
              >
                <svg
                  className={`w-[15px] h-[15px] transition-all duration-200 ${
                    inWishlist ? 'text-[#6B1F2A] fill-[#6B1F2A] scale-110' : 'text-[#C4A0A6] fill-none'
                  }`}
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
            </button>
          </div>

          {/* Middle: price */}
          <div className="flex items-baseline gap-2 flex-wrap">
            {hasDiscount ? (
              <>
                <span
                  className="font-semibold text-[#6B1F2A] nums-normal"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px' }}
                >
                  {formatPrice(product.discountPrice)}
                </span>
                <span className="text-[12px] text-[#B08A90] line-through nums-normal">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span
                className="font-medium text-[#3D1A1E] nums-normal"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px' }}
              >
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Bottom: Add to cart */}
          {!isOutOfStock && (
            <div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding || justAdded}
                className={[
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl min-h-[44px]',
                  'text-xs font-semibold uppercase tracking-[0.1em]',
                  'transition-all duration-200 active:scale-[0.98]',
                  justAdded
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#6B1F2A] text-white hover:bg-[#7D2432] shadow-sm shadow-[#6B1F2A]/20',
                ].join(' ')}
              >
                {cartButtonIcon}
                {t('product.addToCart')}
              </button>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
