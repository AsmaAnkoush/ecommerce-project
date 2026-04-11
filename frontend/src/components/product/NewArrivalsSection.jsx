import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNewArrivals } from '../../api/productApi'
import { useLanguage } from '../../context/LanguageContext'
import ProductCard from './ProductCard'
import Spinner from '../ui/Spinner'

const FLOWER_SRC = '/images/flower-decoration.png'

const LIMIT = 8

/**
 * "New Arrivals" homepage section.
 *
 *  - Fetches from the existing GET /api/products/new-arrivals endpoint, which
 *    on the backend returns active products with `isNew = true`, ordered by
 *    `createdAt DESC`. We re-sort defensively just in case the API ever ships
 *    them in a different order.
 *  - Caps the visible grid at 8 cards.
 *  - Renders the existing ProductCard, so styling, hover overlay, color
 *    picker, and add-to-cart behaviour all stay consistent with the rest of
 *    the store.
 *  - Empty state shows a localized "no new products" message.
 *  - "View All" navigates to /new-arrivals (a dedicated full-page list).
 *
 * Drop-in usage: `<NewArrivalsSection />` — no required props.
 */
export default function NewArrivalsSection({ className = '' }) {
  const { t, isRTL } = useLanguage()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getNewArrivals()
      .then(res => {
        if (cancelled) return
        const list = res.data?.data ?? []
        // Defensive newest-first sort
        const sorted = [...list].sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime()
          const bTime = new Date(b.createdAt || 0).getTime()
          return bTime - aTime
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
    <section className={`relative px-4 sm:px-6 py-20 sm:py-24 lg:py-28 max-w-6xl mx-auto ${className}`}>

      {/* ── Header: [flower] [title + view-all] ─────────────────
           LTR: flower LEFT,  title RIGHT
           RTL: flower RIGHT, title LEFT (via row-reverse)       ──── */}
      <div className="flex items-center gap-2 sm:gap-3 mb-12 sm:mb-14"
           style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>

        {/* Flower — one side only */}
        <img
          src={FLOWER_SRC}
          alt=""
          aria-hidden="true"
          className={`shrink-0 w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 object-contain pointer-events-none select-none ${
            isRTL ? '-scale-x-100' : ''
          }`}
          style={{
            filter: 'brightness(0.9) contrast(3) saturate(0) sepia(1) hue-rotate(-30deg) saturate(4) brightness(0.45) drop-shadow(0 4px 16px rgba(107,31,42,0.3))',
          }}
        />

        {/* Title + View All */}
        <div className="flex-1 min-w-0">
          <h2
            className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[#6B1F2B] leading-none tracking-[0.04em] sm:tracking-[0.06em]"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {t('home.newArrivalsTitle')}
          </h2>
          <div
            className={`h-[1.5px] w-16 sm:w-24 mt-4 sm:mt-5 ${isRTL ? 'ml-auto' : ''}`}
            style={{ background: 'linear-gradient(90deg, #6B1F2B, transparent)' }}
          />

          {!loading && products.length > 0 && (
            <Link
              to="/new-arrivals"
              className="hidden sm:inline-flex items-center gap-2 mt-6 border border-[#6B1F2A]/30 text-[#6B1F2A] text-[11px] tracking-[0.2em] uppercase px-7 py-3 rounded-full font-medium hover:bg-[#6B1F2A] hover:text-white hover:border-[#6B1F2A] transition-all duration-300"
            >
              {t('home.viewAll')}
              <ViewAllArrow />
            </Link>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-14">
          <Spinner size="lg" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-center py-12 text-sm text-[#9B7B80] tracking-wide">
          {t('home.noNewArrivals')}
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
              to="/new-arrivals"
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
