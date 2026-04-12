import { useEffect, useMemo, useState } from 'react'
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
const getColorHex = name => COLOR_MAP[name.toLowerCase()] ?? name.toLowerCase()
const getBaseColor = name => name.split(' ')[0]

/**
 * Product Quick-View modal.
 *
 * Controlled via UIContext: `openQuickView(product)` / `closeQuickView()`.
 * Shows the product image, name, price, color picker, and an Add-to-Cart
 * button — all without navigating away from the current page.
 */
export default function QuickView() {
  const { quickViewProduct, closeQuickView } = useUI()
  const { addToCart } = useCart()
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const { toast } = useToast()

  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize]   = useState(null)
  const [adding, setAdding]               = useState(false)
  const [validationError, setValidationError] = useState('')

  const product = quickViewProduct

  useEffect(() => {
    if (!product) return
    setSelectedColor(null)
    setSelectedSize(null)
    setAdding(false)
    setValidationError('')
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

  // All unique colors with aggregated stock, filtered by selected size when present.
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

  // All unique sizes, filtered by selected color when present.
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

  const hasDiscount = product.discountPrice && product.discountPrice < product.price
  const sizeRequired  = sizeAvailability.length > 0
  const colorRequired = colorAvailability.length > 0
  const selectedVariant = hasVariants && selectedColor && selectedSize
    ? product.variants.find(v => v.color === selectedColor && v.size === selectedSize)
    : null
  const variantStock = selectedVariant?.stockQuantity ?? (hasVariants ? null : product.stockQuantity)
  const isOutOfStock = variantStock === 0 || (!hasVariants && product.stockQuantity === 0)

  const canAdd =
    !adding &&
    !isOutOfStock &&
    (!sizeRequired  || selectedSize)  &&
    (!colorRequired || selectedColor)

  const handleAdd = async () => {
    if (adding || isOutOfStock) return
    if ((sizeRequired && !selectedSize) || (colorRequired && !selectedColor)) {
      setValidationError(t('product.selectSizeAndColor'))
      return
    }
    try {
      setAdding(true)
      await addToCart(product.id, 1, product, selectedSize || null, selectedColor || null)
      toast(t('cart.addedToast'))
      closeQuickView()
    } catch {
      toast(t('common.error'), 'error')
    } finally { setAdding(false) }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div onClick={closeQuickView} className="absolute inset-0 bg-[#3D1A1E]/50 backdrop-blur-sm animate-fade-in" />

      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-scale">
        {/* Close */}
        <button type="button" onClick={closeQuickView} aria-label={t('common.close')}
          className="absolute top-4 end-4 z-10 w-9 h-9 rounded-full bg-white/90 border border-[#F0D5D8] flex items-center justify-center text-[#9B7B80] hover:text-[#6B1F2A] transition-all active:scale-95 shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-1/2 aspect-[3/4] sm:aspect-auto relative overflow-hidden shrink-0"
               style={{ background: 'linear-gradient(145deg, #FDF8F9 0%, #F5ECED 50%, #F0E4E6 100%)' }}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4" style={{ mixBlendMode: 'multiply' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#DFA3AD]">
                <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/55 flex items-center justify-center">
                <span className="bg-[#3D1A1E]/75 text-white text-xs px-4 py-2 rounded-full tracking-wider">{t('product.outOfStock')}</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 start-3 flex flex-col gap-1.5">
              {hasDiscount && <span className="bg-[#6B1F2A] text-white text-[9px] font-semibold px-2.5 py-0.5 rounded-full tracking-wider">{t('product.sale')}</span>}
              {product.isNew && <span className="bg-white/90 text-[#6B1F2A] text-[9px] font-semibold px-2.5 py-0.5 rounded-full border border-[#DFA3AD]/50">{t('product.newArrival')}</span>}
              {product.isBestSeller && <span className="bg-amber-500 text-white text-[9px] font-semibold px-2.5 py-0.5 rounded-full">{t('product.bestSeller')}</span>}
            </div>
          </div>

          {/* Info */}
          <div className="sm:w-1/2 p-6 sm:p-8 flex flex-col justify-between gap-5">
            <div>
              <h2 className="text-2xl font-light text-[#3D1A1E] leading-snug mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-2.5 mb-5">
                {hasDiscount ? (
                  <>
                    <span className="text-xl font-semibold text-[#6B1F2A] nums-normal" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{formatPrice(product.discountPrice)}</span>
                    <span className="text-sm text-[#B08A90] line-through">{formatPrice(product.price)}</span>
                  </>
                ) : (
                  <span className="text-xl font-medium text-[#3D1A1E] nums-normal" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{formatPrice(product.price)}</span>
                )}
              </div>

              {/* Sizes */}
              {sizeAvailability.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold text-[#6B1F2A] uppercase tracking-[0.18em] mb-2.5">{t('product.selectYourSize')}</p>
                  <div className="flex flex-wrap gap-2">
                    {sizeAvailability.map(({ size, stock, available }) => {
                      const selected = selectedSize === size
                      const low = available && stock <= 5
                      return (
                        <button key={size} type="button"
                          onClick={() => { if (available) { setSelectedSize(size); setValidationError('') } }}
                          disabled={!available}
                          aria-disabled={!available}
                          title={!available ? t('admin.variantOutOfStock') : low ? t('admin.variantLowStock') : size}
                          className={[
                            'relative min-w-[44px] h-10 px-3 rounded-full border text-[11px] font-semibold tracking-[0.1em] transition-all duration-200',
                            selected
                              ? 'border-[#6B1F2A] bg-[#6B1F2A] text-white shadow-sm'
                              : !available
                              ? 'border-[#F0D5D8] text-[#C4A0A6] bg-white opacity-50 line-through cursor-not-allowed'
                              : low
                              ? 'border-amber-300 text-amber-700 bg-amber-50 hover:border-amber-500'
                              : 'border-[#E2CDD0] text-[#3D1A1E] bg-white hover:border-[#6B1F2A] hover:text-[#6B1F2A]',
                          ].join(' ')}
                        >
                          {size}
                          {!available && (
                            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <svg className="w-full h-full" viewBox="0 0 48 48" fill="none" preserveAspectRatio="none">
                                <line x1="6" y1="42" x2="42" y2="6" stroke="#C4A0A6" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Colors */}
              {colorAvailability.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold text-[#6B1F2A] uppercase tracking-[0.18em] mb-2.5">{t('product.color')}</p>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {colorAvailability.map(entry => {
                      const hex = getColorHex(getBaseColor(entry.color))
                      const selected = selectedColor === entry.color
                      const low = entry.available && entry.stock <= 5
                      return (
                        <button key={entry.color} type="button"
                          onClick={() => { if (entry.available) { setSelectedColor(entry.color); setValidationError('') } }}
                          disabled={!entry.available}
                          aria-disabled={!entry.available}
                          title={!entry.available ? t('admin.variantOutOfStock') : low ? `${entry.color} — ${t('admin.variantLowStock')}` : entry.color}
                          className={[
                            'relative w-7 h-7 rounded-full ring-1 ring-black/15 ring-offset-1 ring-offset-white transition-all duration-200',
                            entry.available ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-40',
                            selected && entry.available ? 'scale-110 ring-2 ring-[#6B1F2A] shadow-md' : '',
                          ].join(' ')}
                          style={{ backgroundColor: hex }}
                        >
                          {!entry.available && (
                            <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 24 24" fill="none">
                              <line x1="3" y1="21" x2="21" y2="3" stroke="#8B3A44" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Stock hint for selected variant */}
              {selectedVariant && (
                <p className={`text-[11px] mb-3 ${isOutOfStock ? 'text-red-600 font-semibold' : variantStock <= 5 ? 'text-amber-600 font-semibold' : 'text-[#9B7B80]'}`}>
                  {isOutOfStock ? `❌ ${t('admin.variantOutOfStock')}` : variantStock <= 5 ? `⚠️ ${t('admin.variantLowStock')}` : null}
                </p>
              )}

              {validationError && (
                <p className="text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                  {validationError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {!isOutOfStock && (
                <button type="button" onClick={handleAdd} disabled={!canAdd}
                  className="w-full flex items-center justify-center gap-2 bg-[#6B1F2A] text-white py-3.5 rounded-xl text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#7D2432] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#6B1F2A]/20">
                  {adding ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
                  )}
                  {t('product.addToCart')}
                </button>
              )}
              <Link to={`/products/${product.id}`} onClick={closeQuickView}
                className="block text-center w-full border border-[#EDD8DC] text-[#6B1F2A] py-3 rounded-xl text-xs font-medium tracking-[0.12em] uppercase hover:bg-[#FDF0F2] hover:border-[#DFA3AD] transition-colors">
                {t('product.viewDetails')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
