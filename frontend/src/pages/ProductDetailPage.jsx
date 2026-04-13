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
import { useSiteSettings } from '../context/SiteSettingsContext'
import ProductCard from '../components/product/ProductCard'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

function ShareSection({ productName }) {
  const { t } = useLanguage()
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const text = encodeURIComponent(productName || '')
  const encodedUrl = encodeURIComponent(url)

  const platforms = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${text}%20${encodedUrl}`,
      color: 'hover:text-green-600',
      path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
    },
    {
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${text}`,
      color: 'hover:text-sky-500',
      path: 'M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:text-blue-600',
      path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    },
    {
      name: 'Messenger',
      href: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`,
      color: 'hover:text-blue-500',
      path: 'M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z',
    },
    {
      name: 'Instagram',
      href: `https://www.instagram.com/`,
      color: 'hover:text-pink-600',
      path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
    },
  ]

  return (
    <div className="pt-6 mt-6 border-t border-[#F0D5D8]">
      <p
        className="text-xs tracking-[0.15em] uppercase text-[#9B7B80] mb-3"
        style={{ fontFamily: 'Raleway, sans-serif' }}
      >
        {t('product.share')}
      </p>
      <div className="flex items-center gap-2.5">
        {platforms.map(({ name, href, color, path }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={name}
            className={`w-9 h-9 rounded-full flex items-center justify-center bg-[#FDF0F2] border border-[#EDD8DC] text-[#9B7B80] ${color} hover:scale-110 hover:shadow-md transition-all duration-200`}
          >
            <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] fill-current">
              <path d={path} />
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isLoggedIn } = useAuth()
  const { openLogin } = useUI()
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const { toast } = useToast()
  const { contactWhatsApp } = useSiteSettings()
  const storeWhatsApp = (contactWhatsApp || '972594828117').replace(/\D/g, '')

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
  const [showMeasurements, setShowMeasurements] = useState(false)

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
      toast(t('common.reviewSubmitted'))
    } catch (err) {
      const msg = err.response?.data?.message || t('profile.reviewSubmitFailed')
      setReviewError(msg)
      toast(msg, 'error')
    } finally { setReviewSubmitting(false) }
  }

  const handleDeleteReview = async () => {
    if (!confirm(t('product.deleteReviewConfirm'))) return
    try {
      await deleteReview(id)
      setUserReview(null)
      fetchReviews()
      toast(t('profile.reviewDeletedToast'))
    } catch (err) {
      toast(err?.response?.data?.message || t('profile.reviewDeleteFailed'), 'error')
    }
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
  // Colors available for the selected size (reciprocal filter).
  const colorsForSelectedSize = hasVariants && selectedSize
    ? new Set(product.variants.filter(v => v.size === selectedSize && (v.stockQuantity ?? 0) > 0).map(v => v.color))
    : null
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
        <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center gap-2 text-[11px] text-[#9B7B80]">
          <Link to="/" className="hover:text-[#6B1F2A] hover:underline underline-offset-4 decoration-[#DFA3AD]/60 transition-colors">
            {t('common.home')}
          </Link>
          <span className="text-[#DEB8BE] select-none" aria-hidden="true">/</span>
          <Link to="/products" className="hover:text-[#6B1F2A] hover:underline underline-offset-4 decoration-[#DFA3AD]/60 transition-colors">
            {t('products.allProducts')}
          </Link>
          <span className="text-[#DEB8BE] select-none" aria-hidden="true">/</span>
          <span aria-current="page" className="text-[#3D1A1E] font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 lg:py-14 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-10 xl:gap-20">

          {/* ══ LEFT: Image Gallery ══════════════════════════════ */}
          <div className="flex gap-3 sm:gap-5 animate-fade-in-up">

            {/* Vertical thumbnail rail */}
            {allImages.length > 1 && (
              <div className="hidden sm:flex flex-col gap-3 w-[80px] shrink-0">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-300 ease-out ${
                      selectedImg === i
                        ? 'border-[#6B1F2A] shadow-[0_6px_20px_rgba(107,31,42,0.18)] scale-[1.02]'
                        : 'border-[#F5E0E3] hover:border-[#DEB8BE] hover:scale-[1.02] opacity-70 hover:opacity-100'
                    }`}
                    style={{ background: 'linear-gradient(145deg, #FDF8F9, #F0E4E6)' }}
                  >
                    <img src={img} alt={`${i + 1}`} className="w-full h-full object-contain p-1.5" style={{ mixBlendMode: 'multiply' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 relative">
              <div
                className="relative rounded-3xl overflow-hidden aspect-[3/4] cursor-zoom-in group"
                style={{
                  background: 'linear-gradient(145deg, #FDF8F9 0%, #F5ECED 50%, #F0E4E6 100%)',
                  boxShadow: '0 16px 60px rgba(107,31,42,0.12), 0 4px 16px rgba(107,31,42,0.06)',
                }}
                onClick={() => allImages.length > 0 && setZoomOpen(true)}
              >
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-contain p-5 sm:p-8 transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
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
                <div className="absolute top-5 left-5 flex flex-col gap-2">
                  {hasDiscount && (
                    <span className="bg-[#6B1F2A] text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-full tracking-[0.12em] shadow-md shadow-[#6B1F2A]/25 animate-fade-in-scale">
                      -{discountPct}%
                    </span>
                  )}
                  {product.isNew && (
                    <span className="bg-white/95 backdrop-blur-sm text-[#6B1F2A] text-[10px] font-semibold px-3 py-1.5 rounded-full border border-[#DEB8BE] tracking-[0.18em] uppercase">
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
                    const unavailableForSize = colorsForSelectedSize && !colorsForSelectedSize.has(color)
                    return (
                      <button
                        key={color}
                        type="button"
                        title={unavailableForSize ? t('admin.variantOutOfStock') : color}
                        onClick={() => { if (!unavailableForSize) { setSelectedColor(color); setSelectedImg(0) } }}
                        disabled={!!unavailableForSize}
                        aria-disabled={!!unavailableForSize}
                        className={`relative group transition-transform duration-150 ${unavailableForSize ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
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
                        {unavailableForSize && (
                          <svg aria-hidden="true" className="absolute inset-0 w-6 h-6 pointer-events-none" viewBox="0 0 24 24" fill="none">
                            <line x1="3" y1="21" x2="21" y2="3" stroke="#8B3A44" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT: Product Info ══════════════════════════════ */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-8 animate-fade-in-up" style={{ animationDelay: '120ms' }}>

            {/* Category + Name */}
            <div>
              {product.categoryName && (
                <Link
                  to={`/products?category=${product.categoryId}`}
                  className="inline-flex items-center gap-2 text-[10px] tracking-[0.28em] text-[#B08A90] uppercase hover:text-[#6B1F2A] transition-colors mb-4"
                >
                  <span className="w-6 h-px bg-[#DEB8BE]" />
                  {product.categoryName}
                </Link>
              )}
              <h1
                className="text-[24px] sm:text-[30px] lg:text-[34px] font-medium text-[#2A1418] leading-[1.25] tracking-[0.015em]"
                style={{ fontFamily: 'Playfair Display, serif' }}
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

            {/* Price — premium card */}
            <div className="bg-gradient-to-br from-[#FDF6F7] to-[#F9EEF0] rounded-2xl p-5 border border-[#F5E0E3]">
              <div className="flex items-end gap-3 flex-wrap">
                {hasDiscount ? (
                  <>
                    <span
                      className="text-[26px] sm:text-[28px] font-medium text-[#8B2F3A] leading-none nums-normal"
                      style={{ fontFamily: 'Cormorant Garamond, serif' }}
                    >
                      {formatPrice(product.discountPrice)}
                    </span>
                    <span className="text-base text-[#C4A0A6] line-through leading-none mb-1 nums-normal">
                      {formatPrice(product.price)}
                    </span>
                    <span className="ms-auto text-[10px] font-semibold tracking-[0.15em] uppercase bg-[#8B2F3A] text-white px-3 py-1.5 rounded-full mb-1 shadow-sm shadow-[#8B2F3A]/15">
                      {t('product.off')} {discountPct}%
                    </span>
                  </>
                ) : (
                  <span
                    className="text-[26px] sm:text-[28px] font-medium text-[#8B2F3A] leading-none nums-normal"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              {allSelectableColors.length > 0 && !selectedColor
                ? <Badge variant="secondary">{t('product.selectColor')}</Badge>
                : selectedColorHasVariants && !selectedSize
                ? null
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
                    <label className="block text-xs font-medium tracking-[0.04em] text-[#6B1F2B] mb-2.5" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {t('product.selectYourSize')}
                    </label>
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
                            disabled={isOutOfStock}
                            aria-disabled={isOutOfStock}
                            title={isOutOfStock ? t('admin.variantOutOfStock') : size}
                            className={`relative min-w-[52px] h-12 px-3 rounded-full border-2 transition-all duration-300 ease-out text-xs font-semibold tracking-[0.1em] ${
                              isSelected
                                ? 'border-[#6B1F2A] bg-[#6B1F2A] text-white shadow-md shadow-[#6B1F2A]/25 scale-105'
                                : isOutOfStock
                                ? 'border-[#F0D5D8] text-[#C4A0A6] bg-white opacity-50 line-through cursor-not-allowed'
                                : 'border-[#E2CDD0] text-[#3D1A1E] bg-white hover:border-[#6B1F2A] hover:text-[#6B1F2A] hover:scale-105 hover:shadow-sm'
                            }`}
                          >
                            {size}
                            {/* Diagonal line overlay for out-of-stock */}
                            {isOutOfStock && (
                              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <svg className="w-full h-full absolute inset-0 rounded-lg" viewBox="0 0 48 48" fill="none" preserveAspectRatio="none">
                                  <line x1="6" y1="42" x2="42" y2="6" stroke="#C4A0A6" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {!selectedSize && (
                      <p className="mt-2 text-[11px] text-[#B08A90] tracking-wide flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /></svg>
                        {t('product.selectSizeWarning')}
                      </p>
                    )}

                    {/* Measurements — toggle button + table; only rendered when the selected variant has any measurement */}
                    {(() => {
                      if (!selectedVariant) return null
                      const fields = [
                        { key: 'chest',      label: t('product.chest') },
                        { key: 'waist',      label: t('product.waist') },
                        { key: 'shoulders',  label: t('product.shoulders') },
                        { key: 'backWidth',  label: t('product.backWidth') },
                        { key: 'length',     label: t('product.length') },
                      ].filter(f => selectedVariant[f.key] != null)
                      if (fields.length === 0) return null
                      return (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => setShowMeasurements(v => !v)}
                            aria-expanded={showMeasurements}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#6B1F2A] text-[#6B1F2A] text-xs font-medium tracking-wide hover:bg-[#6B1F2A] hover:text-white transition-all duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {showMeasurements ? t('product.hideMeasurements') : t('product.viewMeasurements')}
                            <svg className={`w-3 h-3 transition-transform duration-200 ${showMeasurements ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          <div
                            className="overflow-hidden transition-all duration-300 ease-out"
                            style={{ maxHeight: showMeasurements ? '320px' : '0', opacity: showMeasurements ? 1 : 0, marginTop: showMeasurements ? '12px' : 0 }}
                          >
                            <div className="rounded-xl border border-[#F0D5D8] bg-[#FDFAFB] p-4">
                              <div className="flex items-baseline justify-between mb-3">
                                <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#9B7B80]">
                                  {t('product.measurements')}
                                </p>
                                <span className="text-[10px] text-[#B08A90]">({t('product.cm')})</span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-center text-sm" style={{ borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr className="border-b border-[#F0D5D8]">
                                      {fields.map(f => (
                                        <th key={f.key} className="px-3 py-2 font-semibold text-[#6B4E53] text-xs tracking-wide">{f.label}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      {fields.map(f => (
                                        <td key={f.key} className="px-3 py-2 font-medium text-[#3D1A1E] nums-normal">{selectedVariant[f.key]}</td>
                                      ))}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

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

            {/* Why You'll Love It — premium highlights */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B1F2A] uppercase tracking-[0.2em] mb-3">
                {t('product.whyYoullLove')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: 'M5 13l4 4L19 7', label: t('product.premiumQuality') },
                  { icon: 'M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm5 10h4', label: t('product.fastShip') },
                  { icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', label: t('product.handPicked') },
                ].map(({ icon, label }, i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#F5E0E3] rounded-2xl p-3 text-center hover:border-[#DEB8BE] hover:shadow-[0_4px_14px_rgba(107,31,42,0.08)] transition-all duration-300"
                  >
                    <svg className="w-5 h-5 text-[#6B1F2A] mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                    <p className="text-[10px] font-medium text-[#3D1A1E] tracking-wide leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery card — refined */}
            <div className="bg-gradient-to-br from-[#FDF6F7] to-white border border-[#F0D5D8] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F5E0E3] flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-[#6B1F2A]/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#3D1A1E] tracking-wide">{t('shipping.fastDelivery')}</p>
                  <p className="text-[10px] text-[#9B7B80] mt-0.5">{t('checkout.westBank')} · {t('checkout.jerusalem')} · {t('checkout.inside48')}</p>
                </div>
              </div>
              <div className="px-5 py-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] text-[#9B7B80] uppercase tracking-wider mb-0.5">{t('checkout.westBank')}</p>
                  <p className="text-xs font-bold text-[#6B1F2A] nums-normal" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '15px' }}>{formatPrice(20)}</p>
                </div>
                <div className="border-x border-[#F5E0E3]">
                  <p className="text-[9px] text-[#9B7B80] uppercase tracking-wider mb-0.5">{t('checkout.jerusalem')}</p>
                  <p className="text-xs font-bold text-[#6B1F2A] nums-normal" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '15px' }}>{formatPrice(30)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#9B7B80] uppercase tracking-wider mb-0.5">{t('checkout.inside48')}</p>
                  <p className="text-xs font-bold text-[#6B1F2A] nums-normal" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '15px' }}>{formatPrice(70)}</p>
                </div>
              </div>
              <a
                href={`https://wa.me/${storeWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-50 hover:bg-green-100 border-t border-[#F5E0E3] text-xs text-green-700 hover:text-green-800 font-semibold tracking-wide transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-green-600" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t('product.askOnWhatsApp')}
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
                className={`w-full h-16 rounded-2xl text-sm font-bold tracking-[0.18em] uppercase transition-all duration-300 ease-out flex items-center justify-center gap-3 relative overflow-hidden group ${
                  added
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : canAddToCart
                    ? 'bg-gradient-to-r from-[#6B1F2A] to-[#8B2535] text-white shadow-xl shadow-[#6B1F2A]/30 hover:shadow-2xl hover:shadow-[#6B1F2A]/40 hover:scale-[1.02] active:scale-[0.98]'
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

            {/* ── Share ─────────────────────────────────────── */}
            <ShareSection productName={product.name} />

          </div>
        </div>
      </div>

      {/* ── Sticky Mobile CTA Bar ─────────────────────────────── */}
      <div className="lg:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F0D5D8] shadow-[0_-4px_20px_rgba(107,31,42,0.08)] px-4 py-3 animate-fade-in-up">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#9B7B80] uppercase tracking-wider truncate">{product.name}</p>
            <p className="text-base font-bold text-[#6B1F2A] nums-normal" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}>
              {hasDiscount ? formatPrice(product.discountPrice) : formatPrice(product.price)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`shrink-0 px-6 h-12 rounded-full text-xs font-bold tracking-[0.15em] uppercase flex items-center gap-2 transition-all duration-300 ${
              added
                ? 'bg-green-600 text-white'
                : canAddToCart
                ? 'bg-gradient-to-r from-[#6B1F2A] to-[#8B2535] text-white shadow-lg shadow-[#6B1F2A]/30 active:scale-95'
                : 'bg-[#EDD8DC] text-[#B08A90]'
            }`}
          >
            {added ? '✓' : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
            {added ? '' : t('product.addToCart')}
          </button>
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
                          className={`w-8 h-8 transition-colors ${star <= (hoverRating || reviewForm.rating) ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#E5E7EB] fill-[#E5E7EB]'}`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
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
                  </div>
                  {review.comment && (
                    <p className="text-sm text-[#6B4E53] leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function Stars({ rating, size = 'sm' }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4.5 h-4.5', lg: 'w-5 h-5' }
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`${sizes[size]} ${s <= Math.round(rating) ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#E5E7EB] fill-[#E5E7EB]'}`} viewBox="0 0 24 24">
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
