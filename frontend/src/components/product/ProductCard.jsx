import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const COLOR_MAP = {
  black: '#000000', white: '#E8E8E8', navy: '#001F5B', beige: '#F5F0E8',
  brown: '#8B4513', red: '#CC0000', green: '#2D6A4F', gray: '#9E9E9E',
  camel: '#C19A6B', burgundy: '#800020', olive: '#6B7C44', coral: '#FF6B6B',
  pink: '#FFB6C1', cream: '#FFFDD0', blue: '#1565C0', yellow: '#F9A825',
  orange: '#E65100', purple: '#6A1B9A',
}
const getColorHex = name => COLOR_MAP[name.toLowerCase()] ?? name.toLowerCase()
const getBaseColor = name => name.split(' ')[0]

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState(false)

  const inWishlist = isInWishlist(product.id)
  const isOutOfStock = product.stockQuantity === 0
  const hasDiscount = product.discountPrice && product.discountPrice < product.price

  const uniqueBaseColors = [...new Set(
    (product.variants?.length
      ? product.variants.map(v => v.color).filter(Boolean)
      : product.color ? [product.color] : []
    ).map(getBaseColor)
  )]
  const discountPct = hasDiscount
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : 0

  const handleAddToCart = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) { navigate('/login'); return }
    try {
      setAdding(true)
      await addToCart(product.id, 1)
    } finally { setAdding(false) }
  }

  const handleWishlist = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) { navigate('/login'); return }
    try {
      setToggling(true)
      inWishlist ? await removeFromWishlist(product.id) : await addToWishlist(product.id)
    } finally { setToggling(false) }
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm card-hover"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-[#F9E8EB] aspect-[3/4]">
        {/* Hover shimmer overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#F2D0D6]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#DFA3AD]">
            <svg className="w-14 h-14 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-[#6B1F2A]/80 text-white text-xs font-light px-3 py-1 rounded-full tracking-wider">Out of Stock</span>
          </div>
        )}

        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-[#6B1F2A] text-white text-[10px] font-light px-2 py-0.5 rounded-full tracking-wider">
            -{discountPct}%
          </span>
        )}

        {product.season && (
          <span className={`absolute bottom-3 left-3 text-[9px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm tracking-wide ${
            product.season === 'SUMMER'
              ? 'bg-amber-500/80 text-white'
              : product.season === 'WINTER'
              ? 'bg-sky-500/80 text-white'
              : 'bg-emerald-600/75 text-white'
          }`}>
            {product.season === 'SUMMER' ? '☀️ صيف'
              : product.season === 'WINTER' ? '❄️ شتاء'
              : '🌸 كل المواسم'}
          </span>
        )}

        <button
          onClick={handleWishlist}
          disabled={toggling}
          className="absolute top-3 right-3 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center
            hover:bg-[#F9E8EB] hover:scale-110 active:scale-95
            transition-all duration-200 z-20"
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg className={`w-3.5 h-3.5 transition-colors ${inWishlist ? 'text-[#6B1F2A] fill-[#6B1F2A]' : 'text-[#DFA3AD]'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Color swatches */}
      {uniqueBaseColors.length > 0 && (
        <div className="flex items-center gap-1 px-2.5 pt-2">
          {uniqueBaseColors.slice(0, 6).map(color => (
            <span
              key={color}
              title={color}
              className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0"
              style={{ backgroundColor: getColorHex(color) }}
            />
          ))}
          {uniqueBaseColors.length > 6 && (
            <span className="text-[10px] text-[#9B7B80]">+{uniqueBaseColors.length - 6}</span>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-2.5 sm:p-3">
        {product.brand && <p className="text-[9px] sm:text-[10px] text-[#DFA3AD] uppercase tracking-widest mb-0.5">{product.brand}</p>}
        <h3 className="text-xs sm:text-sm font-light text-[#3D1A1E] line-clamp-2 mb-1.5 sm:mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{product.name}</h3>

        {product.averageRating > 0 && (
          <div className="flex items-center gap-0.5 mb-2">
            {[1,2,3,4,5].map(s => (
              <svg key={s} className={`w-2.5 h-2.5 ${s <= Math.round(product.averageRating) ? 'text-[#DFA3AD] fill-[#DFA3AD]' : 'text-[#F0D5D8] fill-[#F0D5D8]'}`} viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
            <span className="text-[10px] text-[#9B7B80] ml-1">({product.reviewCount})</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div>
            {hasDiscount ? (
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                <p className="text-xs sm:text-sm font-medium text-[#6B1F2A]">₪{Number(product.discountPrice).toFixed(0)}</p>
                <p className="text-[10px] sm:text-xs text-[#9B7B80] line-through">₪{Number(product.price).toFixed(0)}</p>
              </div>
            ) : (
              <p className="text-xs sm:text-sm font-medium text-[#3D1A1E]">₪{Number(product.price).toFixed(0)}</p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#6B1F2A] text-white rounded-xl text-[10px] font-medium
              hover:bg-[#8B2535] hover:shadow-md hover:shadow-[#6B1F2A]/25
              active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 shrink-0 group"
            title="أضيفي للـ Cart"
          >
            {adding ? (
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <svg className="w-2.5 h-2.5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  )
}
