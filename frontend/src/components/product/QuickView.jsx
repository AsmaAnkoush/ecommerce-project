import { useEffect, useMemo, useState } from 'react'
import { X, Minus, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import { useFormatPrice } from '../../utils/formatPrice'
import { useToast } from '../../context/ToastContext'
import { useUI } from '../../context/UIContext'

const COLOR_MAP = {
  black: '#1A1A1A', white: '#F0EEE9', navy: '#1B2A4A', beige: '#F2EBD9',
  brown: '#7C4A2D', red: '#C0392B', green: '#2D6A4F', gray: '#8E8E8E',
  camel: '#C19A6B', burgundy: '#7A1F2E', olive: '#6B7C44', coral: '#E8715A',
  pink: '#F4A8B8', cream: '#FBF7ED', blue: '#1A56C4', yellow: '#F0C040',
  orange: '#D4600A', purple: '#6B2FA0',
}
const getColorHex = name => COLOR_MAP[name?.toLowerCase()] ?? (name?.toLowerCase() || '#888')
const getBaseColor = name => name?.split(' ')[0] ?? ''

export default function QuickView() {
  const { quickViewProduct, closeQuickView } = useUI()
  const { addToCart } = useCart()
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const { toast } = useToast()

  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize]   = useState(null)
  const [quantity, setQuantity]           = useState(1)
  const [adding, setAdding]               = useState(false)
  const [colorError, setColorError]       = useState(false)
  const [sizeError, setSizeError]         = useState(false)

  const product = quickViewProduct

  useEffect(() => {
    if (!product) return
    setSelectedColor(null)
    setSelectedSize(null)
    setQuantity(1)
    setAdding(false)
    setColorError(false)
    setSizeError(false)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') closeQuickView() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [product, closeQuickView])

  const hasVariants = !!product?.variants?.length

  const colorAvailability = useMemo(() => {
    if (!product) return []
    if (hasVariants) {
      const map = new Map()
      for (const v of product.variants) {
        if (!v.color) continue
        if (selectedSize && v.size !== selectedSize) continue
        map.set(v.color, (map.get(v.color) || 0) + (v.stockQuantity || 0))
      }
      return [...map.entries()].map(([color, stock]) => ({ color, stock, available: stock > 0 }))
    }
    if (product.color) {
      const stock = product.stockQuantity || 0
      return [{ color: product.color, stock, available: stock > 0 }]
    }
    return []
  }, [product, hasVariants, selectedSize])

  const sizeAvailability = useMemo(() => {
    if (!product || !hasVariants) return []
    const map = new Map()
    for (const v of product.variants) {
      if (!v.size) continue
      if (selectedColor && v.color !== selectedColor) continue
      map.set(v.size, (map.get(v.size) || 0) + (v.stockQuantity || 0))
    }
    return [...map.entries()].map(([size, stock]) => ({ size, stock, available: stock > 0 }))
  }, [product, hasVariants, selectedColor])

  if (!product) return null

  const hasDiscount   = product.discountPrice && Number(product.discountPrice) < Number(product.price)
  const sizeRequired  = sizeAvailability.length > 0
  const colorRequired = colorAvailability.length > 0

  const selectedVariant = hasVariants && selectedColor && selectedSize
    ? product.variants.find(v => v.color === selectedColor && v.size === selectedSize)
    : null
  const variantStock = selectedVariant?.stockQuantity ?? (hasVariants ? null : product.stockQuantity)
  const isOutOfStock = variantStock === 0 || (!hasVariants && product.stockQuantity === 0)

  // Resolve color-specific primary image when a color is selected
  const displayImage = selectedColor && product.colorImages?.[selectedColor]
    ? (() => {
        const imgs = product.colorImages[selectedColor]
        const primary = imgs.find(e => e.isPrimary)
        return primary?.url ?? imgs[0]?.url ?? product.imageUrl
      })()
    : product.imageUrl || '/images/placeholder-product.jpg'

  const isReadyToAdd = (!colorRequired || selectedColor) && (!sizeRequired || selectedSize)

  const handleAdd = async () => {
    if (adding || isOutOfStock) return
    let hasError = false
    if (colorRequired && !selectedColor) { setColorError(true); hasError = true }
    if (sizeRequired  && !selectedSize)  { setSizeError(true);  hasError = true }
    if (hasError) return
    try {
      setAdding(true)
      await addToCart(product.id, quantity, product, selectedSize || null, selectedColor || null)
      toast(t('cart.addedToast'))
      closeQuickView()
    } catch {
      toast(t('common.error'), 'error')
    } finally { setAdding(false) }
  }

  return (
    /*
     * Overlay: full-screen backdrop, click-outside closes, overflow-y-auto
     * gives the whole overlay a scroll track so very-tall content on very-short
     * screens is always reachable.
     */
    <div
      className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={closeQuickView}
      role="dialog"
      aria-modal="true"
    >
      {/* Flex centering wrapper — min-h-full keeps vertical centering intact
          while still allowing the outer div to scroll when content overflows */}
      <div className="flex min-h-full items-center justify-center p-4">

        {/*
         * Modal wrapper — relative so the close button can be positioned
         * absolutely and stay visible even when the inner card scrolls.
         * Stops click propagation so tapping the card doesn't close the modal.
         */}
        <div
          className="relative w-full max-w-[90%] sm:max-w-md my-auto animate-fade-in-scale"
          onClick={e => e.stopPropagation()}
        >

          {/*
           * Close button — sits OUTSIDE the scrollable card so it never
           * scrolls out of view. z-20 keeps it above the card content.
           */}
          <button
            type="button"
            onClick={closeQuickView}
            aria-label={t('common.close')}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#5A2A2F] hover:text-[#6B1F2A] hover:rotate-90 transition-all duration-300"
          >
            <X className="w-4 h-4" />
          </button>

          {/*
           * Scrollable card — max-h-[90vh] + overflow-y-auto is the primary
           * scroll container for the modal content. The close button above is
           * NOT inside here, so it is always accessible.
           */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">

            {/* ── Product image ──────────────────────────────────────── */}
            <div className="relative w-full h-72 rounded-t-3xl overflow-hidden bg-[#F5F0EC]">

              {/* Blurred fill layer — div with background-size:cover, NOT an <img> with object-fit:cover */}
              <div
                aria-hidden="true"
                className="absolute inset-0 scale-110 blur-xl opacity-35 pointer-events-none"
                style={{ backgroundImage: `url(${displayImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
              {/* Overlay tones down the blur and preserves brand palette */}
              <div className="absolute inset-0 bg-[#F5F0EC]/50 pointer-events-none" />

              {/* Main image — max-w/max-h let it breathe naturally; no forced w-full h-full */}
              <div className="absolute inset-0 flex items-center justify-center pt-10 px-6 pb-3">
                <img
                  src={displayImage}
                  alt={product.name}
                  className="max-w-full max-h-full block transition-opacity duration-300"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-product.jpg' }}
                />
              </div>

              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/55 flex items-center justify-center">
                  <span className="bg-[#3D1A1E]/75 text-white text-xs px-4 py-2 rounded-full tracking-wider backdrop-blur-sm">
                    {t('product.outOfStock')}
                  </span>
                </div>
              )}

              {hasDiscount && (
                <span className="absolute top-3 left-3 bg-[#6B1F2A]/85 text-white text-[9px] font-medium px-2.5 py-1 rounded-full tracking-wider backdrop-blur-sm">
                  {t('product.sale')}
                </span>
              )}
            </div>

            {/* ── Content ────────────────────────────────────────────── */}
            <div className="px-6 pt-5 pb-8 sm:px-7 text-center">

              {/* Product name */}
              <p className="text-[#5A2A2F] text-lg sm:text-xl font-medium tracking-wide mb-1 leading-snug">
                {product.name}
              </p>

              {/* Price */}
              <p className="text-[#6B1F2A] text-base sm:text-lg font-semibold mb-5">
                {hasDiscount ? (
                  <>
                    <span>{formatPrice(product.discountPrice)}</span>
                    <span className="text-sm text-gray-400 line-through ms-2 font-normal">
                      {formatPrice(product.price)}
                    </span>
                  </>
                ) : (
                  formatPrice(product.price)
                )}
              </p>

              {/* Color selection */}
              {colorAvailability.length > 0 && (
                <div className="mb-5">
                  <p className="text-[#5A2A2F] text-xs uppercase tracking-[0.2em] font-medium mb-2">
                    {t('product.color')}
                  </p>
                  <div className={[
                    'flex justify-center gap-2 flex-wrap rounded-xl transition-all duration-200',
                    colorError ? 'ring-2 ring-red-300 p-2' : '',
                  ].join(' ')}>
                    {colorAvailability.map(entry => {
                      const hex = getColorHex(getBaseColor(entry.color))
                      const sel = selectedColor === entry.color
                      return (
                        <button
                          key={entry.color}
                          type="button"
                          onClick={() => {
                            if (entry.available) {
                              setSelectedColor(entry.color)
                              setColorError(false)
                            }
                          }}
                          disabled={!entry.available}
                          title={entry.available ? entry.color : `${entry.color} — out of stock`}
                          className={[
                            'w-8 h-8 rounded-full border border-gray-200 transition-all duration-200',
                            entry.available ? 'cursor-pointer hover:scale-110' : 'opacity-40 cursor-not-allowed',
                            sel && entry.available ? 'ring-2 ring-[#6B1F2A] ring-offset-2 scale-110' : '',
                          ].join(' ')}
                          style={{ backgroundColor: hex }}
                        />
                      )
                    })}
                  </div>
                  {colorError && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {t('product.selectColor') || 'Please select a color'}
                    </p>
                  )}
                </div>
              )}

              {/* Size selection */}
              {sizeAvailability.length > 0 && (
                <div className="mb-6">
                  <p className="text-[#5A2A2F] text-xs uppercase tracking-[0.2em] font-medium mb-2">
                    {t('product.selectYourSize')}
                  </p>
                  <div className={[
                    'flex flex-wrap justify-center gap-2 rounded-xl transition-all duration-200',
                    sizeError ? 'ring-2 ring-red-300 p-2' : '',
                  ].join(' ')}>
                    {sizeAvailability.map(({ size, available }) => {
                      const sel = selectedSize === size
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            if (available) {
                              setSelectedSize(size)
                              setSizeError(false)
                            }
                          }}
                          disabled={!available}
                          className={[
                            'px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200',
                            sel
                              ? 'bg-[#6B1F2A] text-white border-[#6B1F2A]'
                              : !available
                              ? 'border-gray-200 text-gray-300 opacity-50 cursor-not-allowed line-through'
                              : 'border-[#5A2A2F]/20 text-[#5A2A2F] hover:border-[#6B1F2A] hover:bg-[#6B1F2A]/5',
                          ].join(' ')}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                  {sizeError && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {t('product.selectSize') || 'Please select a size'}
                    </p>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <p className="text-[#5A2A2F] text-xs uppercase tracking-[0.2em] font-medium mb-2">
                  {t('product.quantity') || 'Quantity'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full border border-[#5A2A2F]/20 flex items-center justify-center hover:border-[#6B1F2A] transition-colors duration-200"
                  >
                    <Minus className="w-3 h-3 text-[#5A2A2F]" />
                  </button>
                  <span className="w-12 text-center font-medium text-[#5A2A2F] tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-8 h-8 rounded-full border border-[#5A2A2F]/20 flex items-center justify-center hover:border-[#6B1F2A] transition-colors duration-200"
                  >
                    <Plus className="w-3 h-3 text-[#5A2A2F]" />
                  </button>
                </div>
              </div>

              {/* Add to cart CTA */}
              {!isOutOfStock ? (
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding}
                  className={[
                    'w-full py-3 sm:py-3.5 rounded-full text-sm uppercase tracking-[0.2em] font-semibold',
                    'transition-all duration-300',
                    isReadyToAdd && !adding
                      ? 'bg-[#6B1F2A] text-white hover:bg-[#551820] hover:-translate-y-0.5 hover:shadow-lg'
                      : adding
                      ? 'bg-[#6B1F2A] text-white opacity-50 cursor-not-allowed'
                      : 'bg-[#6B1F2A]/50 text-white/80 cursor-pointer',
                  ].join(' ')}
                >
                  {adding ? (
                    <svg className="animate-spin w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    t('product.addToCart')
                  )}
                </button>
              ) : (
                <p className="text-center text-sm text-red-500 font-medium py-3">
                  {t('product.outOfStock')}
                </p>
              )}

              {/* View details link */}
              <Link
                to={`/products/${product.id}`}
                onClick={closeQuickView}
                className="block text-center mt-3 text-xs text-[#6B1F2A]/60 hover:text-[#6B1F2A] underline underline-offset-2 transition-colors duration-200"
              >
                {t('product.viewDetails')}
              </Link>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
