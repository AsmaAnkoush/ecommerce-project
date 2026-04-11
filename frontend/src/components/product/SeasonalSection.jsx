import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSeasonProducts } from '../../api/productApi'
import { useLanguage } from '../../context/LanguageContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import ProductCard from './ProductCard'
import Spinner from '../ui/Spinner'

const LIMIT = 8

/**
 * Maps the active season to its **opposite**.
 *  - WINTER → SUMMER
 *  - SUMMER (or anything else, including ALL_SEASON / null / undefined) → WINTER
 *
 * Defaulting unknown values to WINTER is intentional: if the admin hasn't
 * configured a season, we still show *something* meaningful (winter pieces
 * are typically the larger catalog) instead of an empty section.
 */
const oppositeSeasonOf = (active) => (active === 'WINTER' ? 'SUMMER' : 'WINTER')

/**
 * "Seasonal Opposite" homepage section.
 *
 *  - Reads `activeSeason` from SiteSettingsContext (which comes from the
 *    backend `/api/settings` endpoint), computes the opposite, and fetches
 *    products tagged with that opposite season.
 *  - Caps the visible grid at 8 cards.
 *  - Title + season badge label flip automatically based on the opposite
 *    season — no hardcoding.
 *  - Each card gets a small season badge in the top-end corner (bonus).
 *  - "View All" navigates to `/products?season={oppositeSeason}` so users
 *    can browse the full opposite-season catalog.
 */
export default function SeasonalSection({ className = '' }) {
  const { t } = useLanguage()
  const { activeSeason } = useSiteSettings()
  const oppositeSeason = oppositeSeasonOf(activeSeason)

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSeasonProducts(oppositeSeason)
      .then(res => {
        if (cancelled) return
        const list = res.data?.data ?? []
        setProducts(list.slice(0, LIMIT))
      })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [oppositeSeason])

  /* Title + badge text driven by the opposite season — never hardcoded */
  const isWinter = oppositeSeason === 'WINTER'
  const titleKey   = isWinter ? 'home.prepareForWinter'        : 'home.prepareForSummer'
  const eyebrowKey = isWinter ? 'home.prepareForWinterEyebrow' : 'home.prepareForSummerEyebrow'
  const badgeText  = isWinter ? t('product.winterSeason')      : t('product.summerSeason')
  const badgeStyles = isWinter
    ? 'bg-sky-500/85 text-white'
    : 'bg-amber-500/85 text-white'

  const ViewAllArrow = () => (
    <svg className="w-3 h-3 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )

  const viewAllHref = `/products?season=${oppositeSeason}`

  return (
    <section className={`relative px-4 sm:px-6 py-14 sm:py-16 max-w-6xl mx-auto ${className}`}>

      {/* ── Header: title (start) + View All (end) ──────────── */}
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#DFA3AD] mb-2"
             style={{ fontFamily: 'Raleway, sans-serif' }}>
            ✦ {t(eyebrowKey)}
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-[#3D1A1E]"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
            {t(titleKey)}
          </h2>
          <div className="h-0.5 w-12 mt-3"
               style={{ background: 'linear-gradient(90deg, #DFA3AD, transparent)' }} />
        </div>

        {!loading && products.length > 0 && (
          <Link
            to={viewAllHref}
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
          {t('home.noSeasonalProducts')}
        </p>
      ) : (
        <>
          {/* Grid: 2 cols mobile · 3 cols tablet · 4 cols desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {products.map((p, i) => (
              <div
                key={p.id}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 60, 360)}ms` }}
              >
                <ProductCard product={p} />

                {/* Bonus: small season badge overlay (top-end corner of the card) */}
                <span
                  aria-hidden="true"
                  className={[
                    'absolute top-3 end-3 z-30',
                    'text-[9px] font-medium px-2.5 py-0.5 rounded-full',
                    'backdrop-blur-sm tracking-wide shadow-sm',
                    'pointer-events-none',
                    badgeStyles,
                  ].join(' ')}
                >
                  {badgeText}
                </span>
              </div>
            ))}
          </div>

          {/* Mobile-only "View All" button below the grid */}
          <div className="text-center mt-8 sm:hidden">
            <Link
              to={viewAllHref}
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
