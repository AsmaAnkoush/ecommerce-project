import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBestSellers } from '../api/productApi'
import { useLanguage } from '../context/LanguageContext'
import ProductCard from '../components/product/ProductCard'
import Spinner from '../components/ui/Spinner'

/**
 * Full-page "Best Sellers" listing — the View All target from the homepage
 * BestSellersSection. Mirrors NewArrivalsPage / OffersPage in shape so the
 * visual language is consistent across curated lists.
 */
export default function BestSellersPage() {
  const { t } = useLanguage()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getBestSellers()
      .then(res => {
        if (cancelled) return
        const list = res.data?.data ?? []
        const sorted = [...list].sort((a, b) => {
          const aCount = Number(a.confirmedOrderCount || 0)
          const bCount = Number(b.confirmedOrderCount || 0)
          return bCount - aCount
        })
        setProducts(sorted)
      })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-12">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#DFA3AD] mb-2"
           style={{ fontFamily: 'Raleway, sans-serif' }}>
          ✦ {t('home.bestSellersEyebrow')}
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#3D1A1E]"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t('home.bestSellers')}
        </h1>
        <div className="h-0.5 w-16 mt-3 mx-auto"
             style={{ background: 'linear-gradient(90deg, transparent, #DFA3AD, transparent)' }} />
        {!loading && products.length > 0 && (
          <p className="text-xs text-[#9B7B80] mt-3 tracking-wider">
            {products.length} {products.length === 1 ? t('cart.item') : t('cart.items')}
          </p>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F9EEF0] flex items-center justify-center mb-6 animate-fade-in-scale">
            <svg className="w-9 h-9 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-[#3D1A1E] mb-2 animate-fade-in-up"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('home.noBestSellers')}
          </h2>
          <Link
            to="/products"
            className="animate-fade-in-up delay-200 inline-flex items-center gap-2 px-7 py-3.5 bg-[#6B1F2A] text-white text-xs font-semibold tracking-[0.15em] uppercase rounded-xl hover:bg-[#7D2432] transition-all shadow-sm shadow-[#6B1F2A]/25 hover:shadow-md hover:shadow-[#6B1F2A]/30 mt-4"
          >
            {t('home.shopNow')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {products.map((p, i) => (
            <div
              key={p.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
