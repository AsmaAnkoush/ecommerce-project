import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSeasonProducts } from '../../api/productApi'
import { useLanguage } from '../../context/LanguageContext'
import ProductCard from './ProductCard'
import Spinner from '../ui/Spinner'

const LIMIT = 8

export default function SeasonalSection({ season = 'WINTER', className = '' }) {
  const { t } = useLanguage()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSeasonProducts(season)
      .then(res => {
        if (cancelled) return
        const list = res.data?.data ?? []
        setProducts(list.slice(0, LIMIT))
      })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [season])

  const titleKey = season === 'WINTER' ? 'home.winterCollection' : 'home.summerCollection'
  const viewAllHref = `/products?season=${season}`

  return (
    <section className={`relative mx-3 sm:mx-5 lg:mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-12 lg:py-14 max-w-6xl ${className}`}>

      {/* ── Header: title + inline View All ────────────────── */}
      <div className="flex items-end justify-between mb-10 sm:mb-14 gap-3">
        <div className="flex-1 min-w-0">
          <div>
            <h2
              className="text-[24px] sm:text-[28px] lg:text-[42px] xl:text-[46px] leading-[1.4] pb-[0.15em] inline-block"
              style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
                fontWeight: 500,
                letterSpacing: '0.02em',
                background: 'linear-gradient(135deg, #6B1F2A 0%, #8B2D3A 50%, #6B1F2A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t(titleKey)}
            </h2>

            <div className="flex items-center gap-2.5 mt-3 sm:mt-4">
              <span className="h-px w-10 sm:w-14 bg-[#6B1F2A]/50" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B1F2A]/60" />
              <span className="h-px w-10 sm:w-14 bg-[#6B1F2A]/50" />
            </div>
          </div>
        </div>
        <Link
          to={viewAllHref}
          className="group inline-flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[11px] lg:text-[12px] font-semibold tracking-[0.18em] sm:tracking-[0.22em] uppercase text-[#6B1F2A] border border-[#6B1F2A]/40 rounded-full px-3.5 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 bg-white/40 backdrop-blur-sm hover:bg-[#6B1F2A] hover:text-white hover:border-[#6B1F2A] hover:shadow-[0_8px_20px_rgba(107,31,42,0.25)] hover:-translate-y-0.5 transition-all duration-300 ease-out whitespace-nowrap shrink-0 self-end mb-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {t('home.viewAll')}
          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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

        </>
      )}
    </section>
  )
}
