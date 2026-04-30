import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useLanguage } from '../../context/LanguageContext'
import { useFormatPrice } from '../../utils/formatPrice'
import { useToast } from '../../context/ToastContext'
import { useUI } from '../../context/UIContext'
import { useMemo, useState } from 'react'

const COLOR_MAP = {
  black: '#1A1A1A', white: '#F0EEE9', navy: '#1B2A4A', beige: '#F2EBD9',
  brown: '#7C4A2D', red: '#C0392B', green: '#2D6A4F', gray: '#8E8E8E',
  camel: '#C19A6B', burgundy: '#7A1F2E', olive: '#6B7C44', coral: '#E8715A',
  pink: '#F4A8B8', cream: '#FBF7ED', blue: '#1A56C4', yellow: '#F0C040',
  orange: '#D4600A', purple: '#6B2FA0',
}
const getColorHex = name => COLOR_MAP[name.toLowerCase()] ?? name.toLowerCase()
const getBaseColor = name => name.split(' ')[0]

/**
 * Color-variant picker dot.
 *
 *  - Renders as a small circle filled with the variant's color.
 *  - Disabled (out-of-stock) variants are dimmed and overlaid with a small
 *    cross. Disabled clicks do nothing.
 *  - Selected dot gets a maroon ring and a slight scale.
 *  - `dark` prop tightens contrast when the dot is rendered on top of the
 *    dark hover overlay (uses an offset ring instead of a border halo).
 */
function ColorDot({ entry, selected, onSelect, dark = false }) {
  const hex = getColorHex(getBaseColor(entry.color))

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (entry.available) onSelect(entry.color)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!entry.available}
      aria-label={entry.color}
      aria-pressed={selected}
      title={entry.available ? entry.color : `${entry.color} — out of stock`}
      className={[
        'relative inline-flex items-center justify-center',
        'w-[18px] h-[18px] rounded-full',
        'transition-all duration-200',
        // Border halo
        dark
          ? 'ring-1 ring-white/70 ring-offset-1 ring-offset-transparent'
          : 'ring-1 ring-black/15 ring-offset-1 ring-offset-white',
        // Interactive vs disabled
        entry.available
          ? 'cursor-pointer hover:scale-110'
          : 'cursor-not-allowed opacity-45',
        // Selected emphasis
        selected && entry.available
          ? 'scale-110 ring-2 ring-[#6B1F2A] shadow-[0_2px_6px_rgba(107,31,42,0.35)]'
          : '',
      ].join(' ')}
      style={{ backgroundColor: hex }}
    >
      {!entry.available && (
        <svg className="w-full h-full" viewBox="0 0 20 20" fill="none">
          <path d="M5 5l10 10M15 5L5 15" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M5 5l10 10M15 5L5 15" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const { toast } = useToast()
  const { openQuickView } = useUI()
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [wishBumpKey, setWishBumpKey] = useState(0)
  const [selectedColor, setSelectedColor] = useState(null)

  const inWishlist = isInWishlist(product.id)
  const isOutOfStock = product.stockQuantity === 0
  const hasDiscount = product.discountPrice && product.discountPrice < product.price

  const colorAvailability = useMemo(() => {
    if (product.variants?.length) {
      const map = new Map()
      for (const v of product.variants) {
        if (!v.color) continue
        const stock = v.stockQuantity || 0
        map.set(v.color, (map.get(v.color) || 0) + stock)
      }
      return [...map.entries()].map(([color, stock]) => ({
        color,
        stock,
        available: stock > 0,
      }))
    }
    if (product.color) {
      const stock = product.stockQuantity || 0
      return [{ color: product.color, stock, available: stock > 0 }]
    }
    return []
  }, [product.variants, product.color, product.stockQuantity])

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (adding || justAdded || isOutOfStock) return

    const hasMultipleVariants = (product.variants?.length ?? 0) > 1
    if (hasMultipleVariants) {
      openQuickView(product)
      return
    }

    let colorToUse = selectedColor
    if (!colorToUse && colorAvailability.length > 0) {
      const firstAvailable = colorAvailability.find(c => c.available)
      if (firstAvailable) {
        colorToUse = firstAvailable.color
        setSelectedColor(colorToUse)
      }
    }

    try {
      setAdding(true)
      await addToCart(product.id, 1, product, null, colorToUse || null)
      toast(t('cart.addedToast'))
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
    } catch {
      toast(t('common.error'), 'error')
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
        toast(t('wishlist.addedToast'))
        setWishBumpKey(k => k + 1)
      }
    } catch {
      toast(t('common.error'), 'error')
    } finally { setToggling(false) }
  }

  const handleQuickView = (e) => {
    e.preventDefault()
    e.stopPropagation()
    openQuickView(product)
  }

  const handleSelectColor = (color) => setSelectedColor(color)

  const renderColorRow = (dark) => (
    <div
      className="flex items-center justify-center gap-2.5 pointer-events-auto"
      onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
    >
      {colorAvailability.map(entry => (
        <ColorDot
          key={entry.color}
          entry={entry}
          selected={selectedColor === entry.color}
          onSelect={handleSelectColor}
          dark={dark}
        />
      ))}
    </div>
  )

  return (
    <div
      className="group relative bg-[#FDF6F7] rounded-3xl flex flex-col border border-[#6B1F2A]/10 shadow-[0_2px_8px_rgba(107,31,42,0.04)] transition-all duration-300 ease-out hover:shadow-[0_12px_32px_rgba(107,31,42,0.11)] hover:border-[#6B1F2A]/25 card-hover"
    >
      <Link to={`/products/${product.id}`} className="block">

        {/* ── Image area ─────────────────────────────────────── */}
        <div className="relative overflow-hidden aspect-[3/4] rounded-t-3xl"
             style={{ background: 'linear-gradient(145deg, #FDF8F9 0%, #F5ECED 50%, #F0E4E6 100%)' }}>

          <img
            src={product.imageUrl || '/images/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
            style={{ mixBlendMode: 'multiply' }}
            onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-product.jpg'; }}
          />

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 z-30 bg-white/55 flex items-center justify-center">
              <span className="bg-[#3D1A1E]/75 text-white text-[10px] font-light px-4 py-1.5 rounded-full tracking-[0.15em] backdrop-blur-sm">
                {t('product.outOfStock')}
              </span>
            </div>
          )}

          {/* ── Heart — top-LEFT (start) ────────────────────── */}
          <button
            type="button"
            onClick={handleWishlist}
            disabled={toggling}
            aria-label={inWishlist ? t('product.removeFromWishlist') : t('product.addToWishlist')}
            title={inWishlist ? t('product.removeFromWishlist') : t('product.addToWishlist')}
            className={[
              'absolute top-3 start-3 z-30',
              'w-9 h-9 rounded-full flex items-center justify-center',
              'bg-white/95 backdrop-blur-sm shadow-[0_2px_10px_rgba(107,31,42,0.10)]',
              'transition-all duration-200 hover:scale-110 active:scale-95',
              inWishlist ? 'hover:bg-red-50' : 'hover:bg-[#FFF5F7]',
            ].join(' ')}
          >
            <span
              key={`wish-${wishBumpKey}`}
              className={wishBumpKey > 0 ? 'inline-flex animate-heartbeat' : 'inline-flex'}
            >
              <svg
                className={`w-[16px] h-[16px] transition-all duration-200 ${
                  inWishlist ? 'text-[#6B1F2A] fill-[#6B1F2A] scale-110' : 'text-[#C4A0A6] fill-none'
                }`}
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </span>
          </button>

          {/* ── Badges — top-end corner ───────────────────────── */}
          <div className="absolute top-2.5 end-2.5 z-20 flex flex-col items-end gap-1">
            {hasDiscount && (
              <span className="bg-[#6B1F2A]/85 text-white text-[8px] font-medium px-2 py-[3px] rounded-full tracking-wider backdrop-blur-sm">
                {t('product.sale')}
              </span>
            )}
            {product.isNew && !hasDiscount && (
              <span className="bg-white/80 text-[#6B1F2A] text-[8px] font-medium px-2 py-[3px] rounded-full border border-[#DFA3AD]/40 backdrop-blur-sm">
                {t('product.newArrival')}
              </span>
            )}
            {product.isBestSeller && !hasDiscount && !product.isNew && (
              <span className="bg-amber-500/85 text-white text-[8px] font-medium px-2 py-[3px] rounded-full backdrop-blur-sm">
                {t('product.bestSeller')}
              </span>
            )}
          </div>

          {/* ── Hover overlay — DESKTOP ONLY (md+): Quick View ── */}
          {!isOutOfStock && (
            <div
              className={[
                'hidden md:flex absolute inset-0 z-10',
                'bg-gradient-to-t from-[#1A0A0D]/55 via-[#1A0A0D]/15 to-transparent',
                'opacity-0 group-hover:opacity-100',
                'transition-opacity duration-300',
                'items-end justify-center pb-5',
                'pointer-events-none',
              ].join(' ')}
            >
              <div className="pointer-events-auto translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <button
                  type="button"
                  onClick={handleQuickView}
                  title={t('product.viewDetails')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/92 hover:bg-white text-[#6B1F2A] text-[10px] font-semibold uppercase tracking-[0.12em] shadow-lg transition-all active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {t('product.viewDetails')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Info area ──────────────────────────────────────── */}
        <div className="ps-14 pe-4 sm:pe-5 pt-4 pb-5">

          {/* Color picker — MOBILE ONLY (below image, since no hover) */}
          {colorAvailability.length > 0 && (
            <div className="md:hidden mb-3">
              {renderColorRow(false)}
            </div>
          )}

          {/* Name */}
          <h3
            className="text-[#3D1A1E] line-clamp-2 mb-2 group-hover:text-[#6B1F2A] transition-colors duration-200 leading-snug"
            style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', fontWeight: 500 }}
          >
            {product.name}
          </h3>

          {/* ── Price row ─────────────────────────────────── */}
          <div className="flex items-baseline gap-2.5 flex-wrap mt-1">
            {hasDiscount ? (
              <>
                <span
                  className="font-bold text-[#6B1F2A] nums-normal"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '19px' }}
                >
                  {formatPrice(product.discountPrice)}
                </span>
                <span
                  className="text-[12px] text-[#C4A0A6] line-through decoration-[#C4A0A6]/50 nums-normal"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span
                className="font-semibold text-[#3D1A1E] nums-normal"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '19px' }}
              >
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ── Floating Add-to-Cart button — icon-only circle ── */}
      {!isOutOfStock && (
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding || justAdded}
          aria-label={t('product.addToCart')}
          title={t('product.addToCart')}
          className={[
            'absolute bottom-4 start-4 z-10',
            'w-10 h-10 sm:w-11 sm:h-11 rounded-full',
            'flex items-center justify-center',
            'transition-all duration-300 ease-out',
            'hover:scale-110 active:scale-95',
            justAdded
              ? 'bg-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)]'
              : adding
              ? 'bg-[#6B1F2A]/80 text-white shadow-[0_4px_8px_rgba(107,31,42,0.2)]'
              : 'bg-[#6B1F2A] text-white shadow-[0_4px_14px_rgba(107,31,42,0.35)] hover:shadow-[0_8px_24px_rgba(107,31,42,0.45)]',
          ].join(' ')}
        >
          {adding ? (
            <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : justAdded ? (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          ) : (
            <span className="relative flex items-center justify-center">
              {/* Same shopping-cart SVG as the Navbar */}
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.7}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
              {/* "+" badge — white circle on the top-right of the cart icon */}
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center pointer-events-none shadow-sm">
                <svg className="w-[8px] h-[8px] text-[#6B1F2A]" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M5 2v6M2 5h6"/>
                </svg>
              </span>
            </span>
          )}
        </button>
      )}
    </div>
  )
}
