import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useLanguage } from '../context/LanguageContext'
import ProductCard from '../components/product/ProductCard'

export default function WishlistPage() {
  const { wishlist } = useWishlist()
  const { t } = useLanguage()

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-light text-[#3D1A1E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t('wishlist.title')}
        </h1>
        {wishlist.length > 0 && (
          <p className="text-xs text-[#9B7B80] mt-1 tracking-wider">{wishlist.length} {t('cart.item')}</p>
        )}
        <div className="h-0.5 w-12 mt-2" style={{ background: 'linear-gradient(90deg, #DFA3AD, transparent)' }} />
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F9EEF0] flex items-center justify-center mb-6 animate-fade-in-scale">
            <svg className="w-9 h-9 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-[#3D1A1E] mb-2 animate-fade-in-up" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('wishlist.empty')}
          </h2>
          <p className="text-sm text-[#9B7B80] mb-8 animate-fade-in-up delay-100 tracking-wide max-w-xs">
            {t('wishlist.emptySub')}
          </p>
          <Link
            to="/products"
            className="animate-fade-in-up delay-200 inline-flex items-center gap-2 px-7 py-3.5 bg-[#6B1F2A] text-white text-xs font-semibold tracking-[0.15em] uppercase rounded-xl hover:bg-[#7D2432] transition-all shadow-sm shadow-[#6B1F2A]/25 hover:shadow-md hover:shadow-[#6B1F2A]/30"
          >
            {t('wishlist.explore')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {wishlist.map((product, idx) => (
            <div
              key={product.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(idx * 50, 400)}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
