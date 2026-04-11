import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBestSellers } from '../../api/productApi'
import { useLanguage } from '../../context/LanguageContext'
import ProductCard from './ProductCard'
import Spinner from '../ui/Spinner'

const LIMIT = 8

/**
 * "Best Sellers" homepage section.
 *
 *  - Fetches from the existing GET /api/products/best-sellers endpoint, which
 *    on the backend returns products with `isBestSeller = true`, ordered by
 *    `confirmedOrderCount DESC`. We re-sort defensively in case the API ever
 *    ships them in a different order.
 *  - Caps the visible grid at 8 cards.
 *  - Reuses the existing ProductCard so styling, hover overlay, color picker,
 *    and add-to-cart behaviour stay consistent with the rest of the store.
 *  - Empty state shows a localized "no products" message.
 *  - "View All" navigates to /best-sellers (a dedicated full-page list).
 *
 * Drop-in usage: `<BestSellersSection />` — no required props.
 */
export default function BestSellersSection({ className = '' }) {
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
        // Defensive highest-sales-first sort
        const sorted = [...list].sort((a, b) => {
          const aCount = Number(a.confirmedOrderCount || 0)
          const bCount = Number(b.confirmedOrderCount || 0)
          return bCount - aCount
        })
        setProducts(sorted.slice(0, LIMIT))
      })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const ViewAllArrow = () => (
    <svg className="w-3 h-3 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )

  return (
    <section className={`relative px-4 sm:px-6 py-14 sm:py-16 max-w-6xl mx-auto ${className}`}>

      {/* ── Header: title (start) + View All button (end) ───── */}
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#DFA3AD] mb-2"
             style={{ fontFamily: 'Raleway, sans-serif' }}>
            ✦ {t('home.bestSellersEyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-[#3D1A1E]"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
            {t('home.bestSellers')}
          </h2>
          <div className="h-0.5 w-12 mt-3"
               style={{ background: 'linear-gradient(90deg, #DFA3AD, transparent)' }} />
        </div>

        {/* Desktop / tablet "View All" — hidden on mobile (a centered version
            appears below the grid on small screens for better tap targets) */}
        {!loading && products.length > 0 && (
          <Link
            to="/best-sellers"
            className="hidden sm:inline-flex items-center gap-2 border border-[#DFA3AD] text-[#6B1F2A] text-[11px] tracking-[0.15em] uppercase px-6 py-2.5 rounded-full font-medium hover:bg-[#6B1F2A] hover:text-white hover:border-[#6B1F2A] transition-all duration-300 whitespace-nowrap shrink-0"
          >
            {t('home.viewAll')}
            <ViewAllArrow />
          </Link>
        )}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
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

          {/* Mobile-only "View All" button below the grid */}
          <div className="text-center mt-8 sm:hidden">
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
