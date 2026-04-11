import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProduct } from '../api/productApi'
import { getReviews, addReview, updateReview, deleteReview } from '../api/reviewApi'
import { useCart } from '../context/CartContext'
import { useFormatPrice } from '../utils/formatPrice'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import useRecentlyViewed from '../hooks/useRecentlyViewed'
import ProductCard from '../components/product/ProductCard'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isLoggedIn } = useAuth()
  const { openLogin } = useUI()
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const { toast } = useToast()
  const { recentlyViewed, addViewed } = useRecentlyViewed()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')

  // Image gallery
  const [selectedImg, setSelectedImg] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  // Variant selection
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)

  // Specifications accordion
  const [specsOpen, setSpecsOpen] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [userReview, setUserReview] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    getProduct(id)
      .then(res => {
        const p = res.data.data
        setProduct(p)
        addViewed(p)
        const variantColors = p.variants?.length
          ? [...new Set(p.variants.map(v => v.color).filter(Boolean))]
          : []
        const colorImageKeys = p.colorImages ? Object.keys(p.colorImages) : []
        const firstColor = [...new Set([...variantColors, ...colorImageKeys])][0] ?? null
        if (firstColor) setSelectedColor(firstColor)
      })
      .catch(() => navigate('/products', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const fetchReviews = () => {
    setReviewsLoading(true)
    getReviews(id)
      .then(res => {
        const list = res.data.data
        setReviews(list)
        const stored = localStorage.getItem('user')
        if (stored) {
          const me = JSON.parse(stored)
          setUserReview(list.find(r => r.userId === me.id) || null)
        }
      })
      .finally(() => setReviewsLoading(false))
  }

  useEffect(() => { fetchReviews() }, [id])
  useEffect(() => { setSelectedImg(0) }, [selectedColor])

  const handleAddToCart = async () => {
    try {
      setAdding(true); setError('')
      await addToCart(product.id, quantity, product, selectedSize, selectedColor)
      setAdded(true)
      setTimeout(() => setAdded(false), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add to cart')
    } finally { setAdding(false) }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    try {
      setReviewSubmitting(true); setReviewError('')
      if (userReview) {
        await updateReview(id, reviewForm)
      } else {
        await addReview(id, reviewForm)
      }
      setShowForm(false)
      fetchReviews()
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review')
    } finally { setReviewSubmitting(false) }
  }

  const handleDeleteReview = async () => {
    if (!confirm(t('product.deleteReviewConfirm'))) return
    await deleteReview(id)
    setUserReview(null)
    fetchReviews()
  }

  const openEditForm = () => {
    if (userReview) setReviewForm({ rating: userReview.rating, comment: userReview.comment || '' })
    setShowForm(true)
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  )
  if (!product) return null

  const hasVariants = product.variants && product.variants.length > 0
  const variantColors = hasVariants
    ? [...new Set(product.variants.map(v => v.color).filter(Boolean))]
    : []
  const colorImageKeys = product.colorImages ? Object.keys(product.colorImages) : []
  const allSelectableColors = [...new Set([...variantColors, ...colorImageKeys])]
  const selectedColorHasVariants = hasVariants && variantColors.includes(selectedColor)
  const sizesForColor = selectedColorHasVariants
    ? [...new Set(product.variants.filter(v => v.color === selectedColor).map(v => v.size).filter(Boolean))]
    : []
  const selectedVariant = selectedColorHasVariants && selectedSize
    ? product.variants.find(v => v.color === selectedColor && v.size === selectedSize)
    : null
  const isOutOfStock = selectedColorHasVariants
    ? (selectedVariant ? selectedVariant.stockQuantity === 0 : false)
    : product.stockQuantity === 0
  const maxStock = selectedColorHasVariants
    ? (selectedVariant ? selectedVariant.stockQuantity : 0)
    : product.stockQuantity

  const colorSpecificImages = selectedColor && product.colorImages?.[selectedColor]
    ? [...new Set(product.colorImages[selectedColor].map(e => e.url))]
    : null
  const allImages = colorSpecificImages
    ? colorSpecificImages
    : [...new Set([product.imageUrl, ...(product.imageUrls || [])].filter(Boolean))]
  const currentImage = allImages[selectedImg] || null

  const prevImage = () => setSelectedImg(i => (i - 1 + allImages.length) % allImages.length)
  const nextImage = () => setSelectedImg(i => (i + 1) % allImages.length)

  const hasDiscount = product.discountPrice && product.discountPrice < product.price
  const discountPct = hasDiscount ? Math.round((1 - product.discountPrice / product.price) * 100) : 0

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const canAddToCart = !(
    (allSelectableColors.length > 0 && !selectedColor) ||
    (selectedColorHasVariants && !selectedSize) ||
    isOutOfStock || adding
  )

  return (
    <div className="bg-white min-h-screen">

      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <div className="border-b border-[#F5E8EA]">
        <nav className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center gap-2 text-xs text-[#B08A90] tracking-wider">
          <Link to="/" className="hover:text-[#6B1F2A] transition-colors uppercase">{t('common.home')}</Link>
          <span className="text-[#DEB8BE]">›</span>
          <Link to="/products" className="hover:text-[#6B1F2A] transition-colors uppercase">{t('products.allProducts')}</Link>
          <span className="text-[#DEB8BE]">›</span>
          <span className="text-[#3D1A1E] font-medium truncate max-w-[160px]">{product.name}</span>
        </nav>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px] gap-10 xl:gap-16">

          {/* ══ LEFT: Image Gallery ══════════════════════════════ */}
          <div className="flex gap-3 sm:gap-4">

            {/* Vertical thumbnail rail */}
            {allImages.length > 1 && (
              <div className="hidden sm:flex flex-col gap-2 w-[72px] shrink-0">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`w-full aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      selectedImg === i
                        ? 'border-[#6B1F2A] shadow-md shadow-[#6B1F2A]/10'
                        : 'border-transparent hover:border-[#DEB8BE]'
                    }`}
                    style={{ background: 'linear-gradient(145deg, #FDF8F9, #F0E4E6)' }}
                  >
                    <img src={img} alt={`${i + 1}`} className="w-full h-full object-contain p-1" style={{ mixBlendMode: 'multiply' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 relative">
              <div
                className="relative rounded-2xl overflow-hidden aspect-[3/4] cursor-zoom-in group"
                style={{
                  background: 'linear-gradient(145deg, #FDF8F9 0%, #F5ECED 50%, #F0E4E6 100%)',
                  boxShadow: '0 8px 40px rgba(107,31,42,0.08), 0 2px 12px rgba(107,31,42,0.04)',
                }}
                onClick={() => allImages.length > 0 && setZoomOpen(true)}
              >
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 sm:p-6 transition-transform duration-700 group-hover:scale-[1.04]"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#DEB8BE]">
                    <svg className="w-20 h-20 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {hasDiscount && (
                    <span className="bg-[#6B1F2A] text-white text-[11px] font-medium px-3 py-1 rounded-full tracking-wider">
                      -{discountPct}%
                    </span>
                  )}
                  {product.isNew && (
                    <span className="bg-white text-[#6B1F2A] text-[11px] font-medium px-3 py-1 rounded-full border border-[#DEB8BE] tracking-wider">
                      {t('product.newArrival')}
                    </span>
                  )}
                </div>

                {/* Zoom hint */}
                {currentImage && (
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm">
                    <svg className="w-4 h-4 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                )}

                {/* Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); prevImage() }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
                    >
                      <svg className="w-4 h-4 text-[#3D1A1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); nextImage() }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
                    >
                      <svg className="w-4 h-4 text-[#3D1A1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Dot indicators */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={e => { e.stopPropagation(); setSelectedImg(i) }}
                        className={`rounded-full transition-all duration-300 ${
                          selectedImg === i ? 'w-5 h-1.5 bg-[#6B1F2A]' : 'w-1.5 h-1.5 bg-[#6B1F2A]/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile thumbnail strip */}
              {allImages.length > 1 && (
                <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImg(i)}
                      className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImg === i ? 'border-[#6B1F2A]' : 'border-transparent hover:border-[#DEB8BE]'
                      }`}
                      style={{ background: 'linear-gradient(145deg, #FDF8F9, #F0E4E6)' }}
                    >
                      <img src={img} alt={`${i + 1}`} className="w-full h-full object-contain p-0.5" style={{ mixBlendMode: 'multiply' }} />
                    </button>
                  ))}
                </div>
              )}

              {/* Color circles — below image */}
              {allSelectableColors.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mt-4">
                  {allSelectableColors.map(color => {
                    const isSelected = selectedColor === color
                    return (
                      <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() => { setSelectedColor(color); setSelectedSize(null); setSelectedImg(0) }}
                        className="relative group transition-transform duration-150 hover:scale-110 active:scale-95"
                      >
                        <span className={`absolute inset-[-4px] rounded-full border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-[#6B1F2A] opacity-100'
                            : 'border-transparent group-hover:border-[#DFA3AD] group-hover:opacity-60'
                        }`} />
                        <span
                          className="block w-6 h-6 rounded-full shadow-sm ring-1 ring-black/10"
                          style={{ backgroundColor: color.toLowerCase() }}
                        />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT: Product Info ══════════════════════════════ */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">

            {/* Category + Name */}
            <div>
              {product.categoryName && (
                <Link
                  to={`/products?category=${product.categoryId}`}
                  className="text-[11px] tracking-[0.2em] text-[#B08A90] uppercase hover:text-[#6B1F2A] transition-colors mb-2 block"
                >
                  {product.categoryName}
                </Link>
              )}
              <h1
                className="text-[28px] sm:text-[34px] font-light text-[#1A0A0D] leading-tight"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            {avgRating && (
              <div className="flex items-center gap-2.5">
                <Stars rating={parseFloat(avgRating)} size="sm" />
                <span className="text-sm font-semibold text-[#3D1A1E]">{avgRating}</span>
                <span className="text-xs text-[#B08A90]">({reviews.length} {t('product.reviews')})</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-end gap-3">
              {hasDiscount ? (
                <>
                  <span
                    className="text-[36px] font-light text-[#6B1F2A] leading-none nums-normal"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    {formatPrice(product.discountPrice)}
                  </span>
                  <span className="text-lg text-[#C4A0A6] line-through leading-none mb-1 nums-normal">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs font-semibold bg-[#FDF0F2] text-[#6B1F2A] border border-[#EDD8DC] px-2.5 py-1 rounded-full mb-1">
                    {t('product.off')} {discountPct}%
                  </span>
                </>
              ) : (
                <span
                  className="text-[36px] font-light text-[#1A0A0D] leading-none nums-normal"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Status */}
            <div>
              {allSelectableColors.length > 0 && !selectedColor
                ? <Badge variant="secondary">{t('product.selectColor')}</Badge>
                : selectedColorHasVariants && !selectedSize
                ? <Badge variant="secondary">{t('product.selectSize')}</Badge>
                : isOutOfStock
                ? <Badge variant="danger">{t('product.outOfStock')}</Badge>
                : maxStock > 0 && maxStock < 10
                ? <Badge variant="warning">كمية محدودة</Badge>
                : <Badge variant="success">{t('product.inStock')}</Badge>
              }
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-[#6B4E53] leading-[1.9]">{product.description}</p>
            )}

            <div className="h-px bg-[#F5E8EA]" />

            {/* Attributes (size/color only — brand and material removed from UI) */}
            {((!hasVariants && product.size) || (!hasVariants && product.color)) && (
              <div className="flex flex-wrap gap-2">
                {!hasVariants && product.size && <AttrPill label={t('product.size')} value={product.size} />}
                {!hasVariants && product.color && <AttrPill label={t('product.color')} value={product.color} />}
              </div>
            )}

            {/* Size selector */}
            {allSelectableColors.length > 0 && (
              <div className="space-y-6">

                {/* Size selector */}
                {selectedColorHasVariants && selectedColor && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#3D1A1E] uppercase tracking-[0.2em] mb-3">
                      {t('product.size')}
                      {selectedSize && (
                        <span className="ms-2 font-normal text-[#9B7B80] normal-case tracking-normal">{selectedSize}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sizesForColor.map(size => {
                        const variant = product.variants.find(v => v.color === selectedColor && v.size === size)
                        const stock = variant ? variant.stockQuantity : 0
                        const isOutOfStock = stock === 0
                        const isSelected   = selectedSize === size
                        return (
                          <button
                            key={`sz-${size}`}
                            type="button"
                            onClick={() => !isOutOfStock && setSelectedSize(size)}
                            className={`relative w-12 h-12 rounded-lg border transition-all duration-200 text-xs font-medium tracking-wide ${
                              isSelected
                                ? 'border-[#6B1F2A] bg-[#6B1F2A] text-white shadow-sm'
                                : isOutOfStock
                                ? 'border-[#E8D5D8] text-[#C4A0A6] cursor-pointer hover:border-[#C4A0A6]'
                                : 'border-[#E2CDD0] text-[#3D1A1E] hover:border-[#6B1F2A] hover:text-[#6B1F2A]'
                            }`}
                          >
                            {size}
                            {/* X overlay for out-of-stock */}
                            {isOutOfStock && (
                              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <svg className="w-full h-full absolute inset-0 rounded-lg" viewBox="0 0 48 48" fill="none">
                                  <line x1="10" y1="10" x2="38" y2="38" stroke="#DEB8BE" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Size guide / measurements table */}
                {selectedColorHasVariants && selectedColor && (() => {
                  const variantsForColor = product.variants
                    .filter(v => v.color === selectedColor && v.size)
                    .filter((v, i, arr) => arr.findIndex(x => x.size === v.size) === i)
                  const measureCols = [
                    { key: 'chest', label: 'الصدر' },
                    { key: 'waist', label: 'الخصر' },
                    { key: 'shoulders', label: 'الكتف' },
                    { key: 'backWidth', label: 'الظهر' },
                    { key: 'length', label: 'الطول' },
                  ]
                  const hasMeasurements = variantsForColor.some(v => measureCols.some(c => v[c.key] != null))
                  if (!hasMeasurements) return null
                  return (
                    <div className="rounded-2xl border border-[#F0D5D8] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setSpecsOpen(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#FDF6F7] hover:bg-[#FAF0F2] transition-colors"
                      >
                        <span className="text-xs font-semibold text-[#3D1A1E] uppercase tracking-widest">
                          {t('product.specifications')} <span className="text-[#B08A90] font-normal normal-case tracking-normal">(سم)</span>
                        </span>
                        <svg
                          className={`w-4 h-4 text-[#9B7B80] transition-transform duration-300 ${specsOpen ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <div
                        className="overflow-hidden transition-all duration-300"
                        style={{ maxHeight: specsOpen ? '500px' : '0', opacity: specsOpen ? 1 : 0 }}
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-center">
                            <thead>
                              <tr className="bg-[#FDF6F7] border-b border-[#F0D5D8]">
                                <th className="px-3 py-2.5 text-start text-[#6B3840] font-semibold">{t('product.size')}</th>
                                {measureCols.map(c => (
                                  <th key={c.key} className="px-3 py-2.5 text-[#6B3840] font-semibold">{c.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {variantsForColor.map((v, idx) => (
                                <tr key={`${v.size}-${idx}`}
                                  className={`border-b border-[#FAF0F2] last:border-0 transition-colors ${
                                    selectedSize === v.size
                                      ? 'bg-[#FDF0F2]'
                                      : 'hover:bg-[#FDF8F9]'
                                  }`}>
                                  <td className={`px-3 py-2.5 text-start font-semibold ${selectedSize === v.size ? 'text-[#6B1F2A]' : 'text-[#3D1A1E]'}`}>
                                    {v.size}
                                  </td>
                                  {measureCols.map(c => (
                                    <td key={c.key} className="px-3 py-2.5 text-[#6B4E53]">
                                      {v[c.key] != null ? v[c.key] : '—'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Quantity */}
            {(!allSelectableColors.length || (selectedColor && (!selectedColorHasVariants || selectedVariant))) && !isOutOfStock && (
              <div className="flex items-center gap-4">
                <p className="text-xs font-semibold text-[#3D1A1E] uppercase tracking-widest">{t('product.quantity')}</p>
                <div className="flex items-center rounded-full border border-[#EDD8DC] overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors text-lg"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-[#1A0A0D]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
                    className="w-9 h-9 flex items-center justify-center text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Delivery strip */}
            <div className="bg-[#FDF6F7] border border-[#F0D5D8] rounded-2xl px-4 py-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-[#6B3840]">
                <span className="text-base">⚡</span>
                <span className="font-medium">{t('shipping.fastDelivery')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#9B7B80]">
                <span className="text-base">📦</span>
                <span>{t('checkout.westBank')} {formatPrice(20)} · {t('checkout.jerusalem')} {formatPrice(30)} · {t('checkout.inside48')} {formatPrice(70)}</span>
              </div>
              <a
                href="https://wa.me/972594828117"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-green-700 hover:text-green-800 font-medium transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-green-600 shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>

            {/* Return & exchange policy */}
            <div className="border border-[#EDD8DC] rounded-2xl overflow-hidden">
              <div className="bg-[#FDF6F7] px-4 py-2.5 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[#9B7B80] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#9B7B80]">سياسة الاستبدال والإرجاع</span>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                  <p className="text-xs text-[#6B4E53] leading-relaxed">{t('checkout.noReturns')}</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </span>
                  <p className="text-xs text-[#6B4E53] leading-relaxed">{t('checkout.exchangePolicy')}</p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-1">
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`w-full h-14 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2.5 ${
                  added
                    ? 'bg-green-600 text-white'
                    : canAddToCart
                    ? 'bg-[#6B1F2A] text-white hover:bg-[#8B2535] active:scale-[0.98] shadow-lg shadow-[#6B1F2A]/20 hover:shadow-xl hover:shadow-[#6B1F2A]/30'
                    : 'bg-[#EDD8DC] text-[#B08A90] cursor-not-allowed'
                }`}
              >
                {adding ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : added ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                )}
                {added ? 'تمت الإضافة ✓'
                  : allSelectableColors.length > 0 && !selectedColor ? t('product.selectColor')
                  : selectedColorHasVariants && !selectedSize ? t('product.selectSize')
                  : isOutOfStock ? t('product.outOfStock')
                  : t('product.addToCart')}
              </button>

              <button
                onClick={() => navigate('/cart')}
                className="w-full h-12 rounded-2xl text-xs font-medium tracking-widest uppercase border-2 border-[#EDD8DC] text-[#6B1F2A] hover:border-[#6B1F2A] hover:bg-[#FDF6F7] active:scale-[0.98] transition-all duration-200"
              >
                {t('nav.cart')}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Zoom / Lightbox Modal ─────────────────────────────── */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            onClick={() => setZoomOpen(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <img
            src={currentImage}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl"
            onClick={e => e.stopPropagation()}
          />

          {allImages.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prevImage() }}
                className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={e => { e.stopPropagation(); nextImage() }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setSelectedImg(i) }}
                    className={`rounded-full transition-all duration-300 ${
                      selectedImg === i ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Reviews Section ──────────────────────────────────── */}
      <div className="border-t border-[#F5E8EA] mt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2
                className="text-[28px] font-light text-[#1A0A0D]"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}
              >
                {t('product.reviews')}
              </h2>
              {avgRating && (
                <div className="flex items-center gap-2.5 mt-2">
                  <Stars rating={parseFloat(avgRating)} size="md" />
                  <span className="text-base font-bold text-[#3D1A1E]">{avgRating}</span>
                  <span className="text-sm text-[#B08A90]">/ 5 · {reviews.length} {t('product.reviews')}</span>
                </div>
              )}
            </div>
            {isLoggedIn && !showForm && (
              <button
                onClick={openEditForm}
                className="flex items-center gap-2 bg-[#6B1F2A] text-white px-5 py-2.5 rounded-full text-xs font-medium tracking-widest uppercase hover:bg-[#8B2535] transition-colors shadow-md shadow-[#6B1F2A]/15"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {userReview ? 'تعديل تقييمك' : t('product.writeReview')}
              </button>
            )}
          </div>

          {/* Review form */}
          {showForm && isLoggedIn && (
            <div className="bg-[#FDF6F7] rounded-3xl p-6 sm:p-8 mb-10 border border-[#F0D5D8]">
              <h3 className="font-semibold text-[#1A0A0D] mb-6 text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {userReview ? 'تحديث تقييمك' : t('product.writeReview')}
              </h3>
              <form onSubmit={handleReviewSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#3D1A1E] uppercase tracking-widest block mb-3">تقييمكِ *</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-8 h-8 transition-colors ${star <= (hoverRating || reviewForm.rating) ? 'text-[#DFA3AD] fill-[#DFA3AD]' : 'text-[#EDD8DC] fill-[#EDD8DC]'}`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
                    <span className="ms-2 text-sm text-[#9B7B80]">
                      {['', 'ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'][hoverRating || reviewForm.rating]}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#3D1A1E] uppercase tracking-widest block mb-2">تعليق (اختياري)</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    rows={4}
                    placeholder="شاركينا تجربتك مع هذا المنتج..."
                    className="w-full px-4 py-3 border border-[#EDD8DC] rounded-2xl text-sm text-[#3D1A1E] focus:outline-none focus:border-[#6B1F2A] resize-none bg-white placeholder-[#C4A0A6] transition-colors"
                  />
                </div>
                {reviewError && <p className="text-sm text-red-500">{reviewError}</p>}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-6 py-2.5 bg-[#6B1F2A] text-white rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-[#8B2535] transition-colors disabled:opacity-60"
                  >
                    {reviewSubmitting ? 'جاري الإرسال...' : userReview ? 'تحديث التقييم' : 'إرسال التقييم'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 border border-[#EDD8DC] text-[#6B3840] rounded-full text-xs font-semibold tracking-widest uppercase hover:border-[#6B1F2A] transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Not logged in — reviews are restricted to authenticated users */}
          {!isLoggedIn && (
            <div className="bg-[#FDF6F7] rounded-2xl p-5 mb-8 flex items-center justify-between gap-4 border border-[#F0D5D8]">
              <p className="text-sm text-[#6B4E53]">{t('product.loginToReview')}</p>
              <button
                type="button"
                onClick={openLogin}
                className="text-xs font-semibold bg-[#6B1F2A] text-white px-5 py-2 rounded-full hover:bg-[#8B2535] transition-colors tracking-wider uppercase whitespace-nowrap"
              >
                {t('nav.login')}
              </button>
            </div>
          )}

          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[#FDF0F2] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#DEB8BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="font-medium text-[#3D1A1E]" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px' }}>{t('product.noReviews')}</p>
              <p className="text-sm text-[#B08A90] mt-1">{t('product.writeReview')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.map(review => (
                <div key={`review-${review.id}`} className="bg-white rounded-2xl border border-[#F5E8EA] p-5 hover:border-[#EDD8DC] hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#6B1F2A] to-[#A33545] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                        {review.userName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A0A0D] text-sm">{review.userName}</p>
                        <p className="text-[11px] text-[#B08A90]">
                          {new Date(review.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {userReview?.id === review.id && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={openEditForm} className="text-xs text-[#6B1F2A] hover:underline font-medium">{t('admin.edit')}</button>
                        <button onClick={handleDeleteReview} className="text-xs text-red-400 hover:text-red-600 font-medium">{t('admin.delete')}</button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Stars rating={review.rating} size="sm" />
                    <span className="text-xs font-semibold text-[#6B4E53]">
                      {['', 'ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'][review.rating]}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-[#6B4E53] leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ RECENTLY VIEWED ═══ */}
        {recentlyViewed.length > 1 && (
          <section className="mt-16 sm:mt-20">
            <h2 className="text-2xl sm:text-3xl font-light text-[#3D1A1E] mb-6 text-center"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
              {t('product.recentlyViewed')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {recentlyViewed
                .filter(p => String(p.id) !== String(id))
                .slice(0, 4)
                .map((p, i) => (
                  <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function Stars({ rating, size = 'sm' }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4.5 h-4.5', lg: 'w-5 h-5' }
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`${sizes[size]} ${s <= Math.round(rating) ? 'text-[#DFA3AD] fill-[#DFA3AD]' : 'text-[#EDD8DC] fill-[#EDD8DC]'}`} viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

function AttrPill({ label, value }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#FDF6F7] border border-[#F0D5D8] rounded-full px-3.5 py-1.5">
      <span className="text-[10px] text-[#B08A90] uppercase tracking-wider">{label}:</span>
      <span className="text-xs font-medium text-[#3D1A1E]">{value}</span>
    </div>
  )
}
