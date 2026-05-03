import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSeasons } from '../../api/seasonApi'
import { useLanguage } from '../../context/LanguageContext'
import Spinner from '../ui/Spinner'

function SeasonCircle({ season, index }) {
  const to = `/products?season=${season.id}`
  return (
    <Link
      to={to}
      className="group flex flex-col items-center text-center animate-fade-in-up
                 shrink-0 w-[78px] sm:w-[96px] lg:w-[114px] snap-center
                 overflow-visible opacity-0"
      style={{ animationDelay: `${Math.min(index * 100, 600)}ms` }}
    >
      <div
        className="relative w-full aspect-square rounded-full overflow-hidden
                   border border-[#C8808C]/25
                   shadow-[0_4px_14px_rgba(107,31,42,0.09)]
                   transition-all duration-350 ease-out
                   group-hover:scale-[1.05] group-hover:shadow-[0_10px_28px_rgba(107,31,42,0.16)]
                   group-hover:border-[#C8808C]/45"
        style={{ backgroundColor: '#F2D5DA' }}
      >
        {season.imageUrl ? (
          <img
            src={season.imageUrl}
            alt={season.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#DFA3AD]">
            <svg className="w-7 h-7 sm:w-10 sm:h-10 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        )}

        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-[#1A0A0D]/15 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      <span
        className="mt-2 sm:mt-3 text-[10px] sm:text-[13px] font-semibold
                   tracking-[0.06em] sm:tracking-[0.10em] text-[#3D1218]
                   group-hover:text-[#6B1F2A] transition-all duration-200
                   leading-tight"
        style={{
          fontFamily: 'Playfair Display, serif',
          textShadow: '0 1px 3px rgba(107,31,42,0.15), 0 0 8px rgba(255,255,255,0.5)',
        }}
      >
        {season.name}
      </span>
    </Link>
  )
}

export default function SeasonalCirclesSection({ className = '' }) {
  const { t } = useLanguage()
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)
  const [showLeftArrow,  setShowLeftArrow]  = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSeasons()
      .then(res => { if (!cancelled) setSeasons(res.data?.data ?? []) })
      .catch(() => { if (!cancelled) setSeasons([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const updateArrowVisibility = () => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const hasOverflow = scrollWidth > clientWidth + 1
    setShowLeftArrow(hasOverflow && scrollLeft > 5)
    setShowRightArrow(hasOverflow && scrollLeft + clientWidth < scrollWidth - 5)
  }

  useEffect(() => {
    if (loading) return
    const raf = requestAnimationFrame(updateArrowVisibility)
    return () => cancelAnimationFrame(raf)
  }, [loading, seasons])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrowVisibility, { passive: true })
    window.addEventListener('resize', updateArrowVisibility)
    return () => {
      el.removeEventListener('scroll', updateArrowVisibility)
      window.removeEventListener('resize', updateArrowVisibility)
    }
  }, [])

  const scroll = (direction) => {
    if (!scrollRef.current) return
    const rtl = document.documentElement.dir === 'rtl'
    const delta = direction === 'right' ? 240 : -240
    scrollRef.current.scrollBy({ left: rtl ? -delta : delta, behavior: 'smooth' })
  }

  return (
    <section className={`relative mx-3 sm:mx-5 lg:mx-auto px-4 sm:px-8 lg:px-12 max-w-6xl ${className}`}>

      {/* ── Title ──────────────────────────────────────────── */}
      <div className="mb-6 sm:mb-8 text-center">
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
          {t('home.shopBySeason')}
        </h2>

        <div className="flex items-center justify-center gap-2.5 mt-3 sm:mt-4">
          <span className="h-px w-10 sm:w-14 bg-[#6B1F2A]/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#6B1F2A]/60" />
          <span className="h-px w-10 sm:w-14 bg-[#6B1F2A]/50" />
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : seasons.length === 0 ? (
        <p className="text-center py-10 text-sm text-[#9B7B80] tracking-wide">
          {t('home.noSeasons')}
        </p>
      ) : (
        <div className="relative">
          {/* ── Left arrow (lg+ only, smart visibility) ─────── */}
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-5
                        items-center justify-center
                        w-11 h-11 rounded-full
                        bg-white/90 backdrop-blur-sm
                        border border-[#6B1F2A]/20 text-[#6B1F2A]
                        shadow-[0_4px_16px_rgba(107,31,42,0.12)]
                        hover:bg-[#6B1F2A] hover:text-white hover:border-[#6B1F2A]
                        hover:shadow-[0_6px_20px_rgba(107,31,42,0.25)]
                        hover:scale-110
                        transition-all duration-300 ease-out
                        ${showLeftArrow ? 'hidden lg:flex opacity-100' : 'hidden opacity-0 pointer-events-none'}`}
          >
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* ── Scroll row (all screen sizes) ──────────────── */}
          <div
            ref={scrollRef}
            className="overflow-x-auto scroll-smooth pb-3 px-1 lg:px-12
                       [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          >
            <div className="flex flex-row justify-center gap-5 sm:gap-7 lg:gap-9 snap-x snap-mandatory min-w-min mx-auto w-fit">
              {seasons.map((season, i) => (
                <SeasonCircle key={season.id} season={season} index={i} />
              ))}
            </div>
          </div>

          {/* ── Right arrow (lg+ only, smart visibility) ────── */}
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-5
                        items-center justify-center
                        w-11 h-11 rounded-full
                        bg-white/90 backdrop-blur-sm
                        border border-[#6B1F2A]/20 text-[#6B1F2A]
                        shadow-[0_4px_16px_rgba(107,31,42,0.12)]
                        hover:bg-[#6B1F2A] hover:text-white hover:border-[#6B1F2A]
                        hover:shadow-[0_6px_20px_rgba(107,31,42,0.25)]
                        hover:scale-110
                        transition-all duration-300 ease-out
                        ${showRightArrow ? 'hidden lg:flex opacity-100' : 'hidden opacity-0 pointer-events-none'}`}
          >
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </section>
  )
}
