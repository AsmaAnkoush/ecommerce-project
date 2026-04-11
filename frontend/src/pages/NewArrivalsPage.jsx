import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNewArrivals } from '../api/productApi'
import { useLanguage } from '../context/LanguageContext'
import ProductCard from '../components/product/ProductCard'
import Spinner from '../components/ui/Spinner'

/**
 * Full-page "New Arrivals" listing — the View All target from the homepage
 * NewArrivalsSection. Mirrors OffersPage in shape so the visual language is
 * consistent with the rest of the store's curated lists.
 */
export default function NewArrivalsPage() {
  const { t } = useLanguage()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getNewArrivals()
      .then(res => {
        if (cancelled) return
        const list = res.data?.data ?? []
        const sorted = [...list].sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime()
          const bTime = new Date(b.createdAt || 0).getTime()
          return bTime - aTime
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
          ✦ {t('home.newArrivalsEyebrow')}
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#3D1A1E]"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t('home.newArrivalsTitle')}
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-[#3D1A1E] mb-2 animate-fade-in-up"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('home.noNewArrivals')}
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
