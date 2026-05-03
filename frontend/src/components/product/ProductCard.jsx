import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Shuffle } from 'lucide-react'
import CartIcon from '../ui/CartIcon'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import { useUI } from '../../context/UIContext'
import { useFormatPrice } from '../../utils/formatPrice'


export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { t } = useLanguage()
  const { toast } = useToast()
  const { openQuickView } = useUI()
  const formatPrice = useFormatPrice()
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [wishBumpKey, setWishBumpKey] = useState(0)
  const [selectedColor, setSelectedColor] = useState(null)

  const inWishlist = isInWishlist(product.id)
  const isOutOfStock = product.stockQuantity === 0
  const hasDiscount = product.discountPrice != null && Number(product.discountPrice) < Number(product.price)

  const colorAvailability = useMemo(() => {
    if (product.variants?.length) {
      const map = new Map()
      for (const v of product.variants) {
        if (!v.color) continue
        map.set(v.color, (map.get(v.color) || 0) + (v.stockQuantity || 0))
      }
      return [...map.entries()].map(([color, stock]) => ({ color, stock, available: stock > 0 }))
    }
    if (product.color) {
      return [{ color: product.color, stock: product.stockQuantity || 0, available: (product.stockQuantity || 0) > 0 }]
    }
    return []
  }, [product.variants, product.color, product.stockQuantity])

  const uniqueSizes = useMemo(() => {
    if (!product.variants?.length) return []
    const seen = new Set()
    const result = []
    for (const v of product.variants) {
      if (v.size && !seen.has(String(v.size))) {
        seen.add(String(v.size))
        result.push(String(v.size))
      }
    }
    return result
  }, [product.variants])

  // Resolve display image: color-specific primary → product primary
  const displayImage = useMemo(() => {
    if (selectedColor && product.colorImages?.[selectedColor]) {
      const imgs = product.colorImages[selectedColor]
      const primary = imgs.find(e => e.isPrimary)
      return primary?.url ?? imgs[0]?.url ?? product.imageUrl
    }
    return product.imageUrl || '/images/placeholder-product.jpg'
  }, [selectedColor, product.colorImages, product.imageUrl])

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (adding || justAdded || isOutOfStock) return
    const hasMultipleVariants = (product.variants?.length ?? 0) > 1
    if (hasMultipleVariants) { openQuickView(product); return }
    let colorToUse = selectedColor
    if (!colorToUse && colorAvailability.length > 0) {
      const first = colorAvailability.find(c => c.available)
      if (first) { colorToUse = first.color; setSelectedColor(colorToUse) }
    }
    try {
      setAdding(true)
      await addToCart(product.id, 1, product, null, colorToUse || null)
      toast(t('cart.addedToast'))
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
    } catch { toast(t('common.error'), 'error') }
    finally { setAdding(false) }
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
    } catch { toast(t('common.error'), 'error') }
    finally { setToggling(false) }
  }

  const handleQuickView = (e) => {
    e.preventDefault()
    e.stopPropagation()
    openQuickView(product)
  }

  return (
    <div className="group relative">
      <Link to={`/products/${product.id}`} className="block">

        {/* ── Image box ───────────────────────────────────── */}
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#F5F0EC] flex items-center justify-center">
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-product.jpg' }}
          />

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 z-30 bg-white/55 flex items-center justify-center">
              <span className="bg-[#3D1A1E]/75 text-white text-[10px] font-light px-4 py-1.5 rounded-full tracking-[0.15em] backdrop-blur-sm">
                {t('product.outOfStock')}
              </span>
            </div>
          )}

          {/* ── Top-right: Heart + Shuffle ──────────────── */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleWishlist}
              disabled={toggling}
              aria-label={inWishlist ? t('product.removeFromWishlist') : t('product.addToWishlist')}
              className={[
                'cursor-pointer transition-colors duration-300',
                inWishlist ? 'text-[#6B1F2A]' : 'text-white hover:text-[#6B1F2A]',
              ].join(' ')}
            >
              <span
                key={`wish-${wishBumpKey}`}
                className={wishBumpKey > 0 ? 'inline-flex animate-heartbeat' : 'inline-flex'}
              >
                <Heart
                  className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm"
                  fill={inWishlist ? 'currentColor' : 'none'}
                  strokeWidth={inWishlist ? 0 : 2}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={handleQuickView}
              aria-label={t('product.viewDetails')}
              className="text-white hover:text-[#6B1F2A] transition-colors duration-300 cursor-pointer"
            >
              <Shuffle className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm" strokeWidth={2} />
            </button>
          </div>

          {/* ── Bottom-left: Cart ───────────────────────── */}
          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding || justAdded}
              aria-label={t('product.addToCart')}
              className={[
                'absolute bottom-3 left-3 z-10',
                'w-9 h-9 sm:w-10 sm:h-10 rounded-full shadow-md hover:shadow-lg',
                'flex items-center justify-center transition-all duration-300',
                justAdded
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-[#6B1F2A] hover:bg-[#6B1F2A] hover:text-white',
              ].join(' ')}
            >
              {adding ? (
                <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : justAdded ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <CartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          )}


          {/* Sale badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <span className="bg-[#6B1F2A]/85 text-white text-[8px] font-medium px-2 py-[3px] rounded-full tracking-wider backdrop-blur-sm">
                {t('product.sale')}
              </span>
            </div>
          )}
        </div>

        {/* ── Info section ─────────────────────────────── */}
        <div className="pt-2 pb-1 text-center">
          {/* Product name */}
          <p
            className="text-[#5A2A2F] text-sm sm:text-base font-medium tracking-wide mb-1 line-clamp-1"
            style={{ fontFamily: "'Montserrat', 'Poppins', sans-serif", letterSpacing: '0.03em' }}
          >
            {product.name}
          </p>

          {/* Sizes — between name and price */}
          {uniqueSizes.length > 0 && (
            <p className="text-xs font-medium text-[#5A1420]/45 text-center px-2 mb-1 leading-4">
              {uniqueSizes.map((sz, i) => (
                <span key={sz} className="whitespace-nowrap">
                  {sz}
                  {i < uniqueSizes.length - 1 && (
                    <span className="mx-1 text-[15px] opacity-50" aria-hidden="true">·</span>
                  )}
                </span>
              ))}
            </p>
          )}

          {/* Price */}
          <p
            className="text-[#5A2A2F] text-sm sm:text-base font-medium"
            style={{ fontFamily: "'Montserrat', 'Poppins', sans-serif", letterSpacing: '0.02em' }}
          >
            {hasDiscount ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="text-xs text-[#9B7B80] line-through">
                  {formatPrice(product.price, { showSymbol: false })}
                </span>
                <span>{formatPrice(product.discountPrice)}</span>
              </span>
            ) : (
              formatPrice(product.price)
            )}
          </p>
        </div>

      </Link>
    </div>
  )
}
