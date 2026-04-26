import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBestSellers, getSeasonProducts } from '../../api/productApi'
import { useLanguage } from '../../context/LanguageContext'
import ProductCard from './ProductCard'
import Spinner from '../ui/Spinner'

export default function BestSellersSection({ season = null, className = '' }) {
  const { t } = useLanguage()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const request = season ? getSeasonProducts(season) : getBestSellers()
    request
      .then(res => {
        if (cancelled) return
        const list = res.data?.data ?? []
        const sorted = [...list].sort((a, b) =>
          Number(b.confirmedOrderCount || 0) - Number(a.confirmedOrderCount || 0)
        )
        setProducts(sorted)
      })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [season])

  const ViewAllArrow = () => (
    <svg className="w-3 h-3 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )

  return (
    <section className={`relative mx-3 sm:mx-5 lg:mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-12 lg:py-14 max-w-6xl ${className}`}>

      {/* ── Header: title ──────────────────────────────────── */}
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-block">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#6B1F2B] leading-none tracking-[0.04em] sm:tracking-[0.06em] inline-flex items-center gap-2.5"
              style={{ fontFamily: 'Playfair Display, serif' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DFA3AD] opacity-70" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#DFA3AD] opacity-45" />
            </span>
            {t('home.bestSellers')}
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DFA3AD] opacity-45" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#DFA3AD] opacity-70" />
            </span>
          </h2>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-14">
          <Spinner size="lg" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-center py-12 text-sm text-[#9B7B80] tracking-wide">
          {t('home.noBestSellers')}
        </p>
      ) : (
        <>
          {/* Grid: 2 cols mobile · 3 cols tablet · 4 cols desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {products.map((p, i) => (
              <div
                key={p.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 60, 360)}ms` }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          {/* "View All" button below the grid */}
          <div className="text-center mt-8">
            <Link
              to="/best-sellers"
              className="inline-flex items-center gap-2 border border-[#DFA3AD] text-[#6B1F2A] text-[11px] tracking-[0.15em] uppercase px-7 py-3 rounded-full font-medium hover:bg-[#6B1F2A] hover:text-white hover:border-[#6B1F2A] transition-all duration-300"
            >
              {t('home.viewAll')}
              <ViewAllArrow />
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
