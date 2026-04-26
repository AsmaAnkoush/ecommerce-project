import { Link } from 'react-router-dom'
import CategorySection from '../components/category/CategorySection'
import NewArrivalsSection from '../components/product/NewArrivalsSection'
import BestSellersSection from '../components/product/BestSellersSection'
import SeasonalSection from '../components/product/SeasonalSection'
import useInView from '../hooks/useInView'
import { useLanguage } from '../context/LanguageContext'
import { useSiteSettings } from '../context/SiteSettingsContext'

/* ── Hero ───────────────────────────────────────────────────────────────── */
function Hero({ innerRef, inView, t, activeSeason }) {
  const shopHref = activeSeason ? `/products?season=${activeSeason}` : '/products'
  return (
    <section ref={innerRef} className="bg-[#F2E0E4] lg:min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-10 sm:py-14 lg:py-0 lg:min-h-screen lg:flex lg:items-center lg:pb-24">

        {/* Mobile: column (image top, text bottom)
            Desktop: row (text left, image right) */}
        <div className="flex flex-row items-center justify-center gap-6 sm:gap-10 lg:gap-55 w-full">
          {/* ── Text ───────────────────────────────────────── */}
          <div className={`max-w-[260px] sm:max-w-[360px] lg:max-w-[480px] min-w-0 text-left ${inView ? 'animate-fade-in-up' : 'opacity-0'}`}>

            <h1 className="text-center">
              <span
                className="block text-[42px] sm:text-[58px] lg:text-[74px] leading-[1] tracking-[0.08em] uppercase text-[#5A1520]"
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}
              >
                I Wear
              </span>
              <span
                className="block text-[18px] sm:text-[20px] lg:text-[24px] leading-[1] mt-2 sm:mt-3 tracking-[0.08em] text-white/90 text-right"
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 400 }}
              >
                by Areej
              </span>
            </h1>

            <div className="flex items-center gap-3.5 mt-7 mb-4 lg:mt-10 lg:mb-5">
              <div className="h-px w-8 sm:w-14 bg-[#DFA3AD]/60" />
              <span className="text-[8px] sm:text-[9px] tracking-[0.4em] uppercase text-[#C4A0A6] font-semibold"
                    style={{ fontFamily: 'Raleway, sans-serif' }}>
                Boutique
              </span>
              <div className="h-px w-8 sm:w-14 bg-[#DFA3AD]/60" />
            </div>

            <p className="text-[13px] lg:text-[15px] text-[#9B7B80] leading-[1.8] max-w-[360px] font-light tracking-wide hidden sm:block sm:mx-0 mx-auto">
              {t('home.newArrivalsDesc')}
            </p>

            <div className="flex items-center gap-4 sm:gap-6 mt-5 sm:mt-7">
              <Link to={shopHref}
                className="hero-cta group relative inline-flex items-center gap-2 sm:gap-2.5 bg-[#6B1F2A] text-white text-[8px] sm:text-[11px] font-semibold tracking-[0.22em] sm:tracking-[0.24em] uppercase px-5 sm:px-10 py-2.5 sm:py-4 rounded-full animate-hero-btn-float hover:[animation-play-state:paused] hover:bg-[#551820] hover:-translate-y-1 hover:scale-[1.06] hover:shadow-[0_14px_40px_rgba(107,31,42,0.45),0_0_32px_6px_rgba(223,163,173,0.6)] active:scale-[0.97] transition-[transform,box-shadow,background-color] duration-300 ease-out">
                {t('home.shopNow')}
                <svg className="w-3.5 h-3.5 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link to={shopHref}
                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.18em] uppercase text-[#6B1F2A] hover:text-[#3D1A1E] hover:tracking-[0.22em] transition-all duration-300">
                {t('home.viewAll')}
                <svg className="w-3 h-3 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* ── Image ─────────────────────────────────────── */}
          <div className={`shrink-0 w-44 sm:w-60 lg:w-80 ${inView ? 'animate-fade-in delay-150' : 'opacity-0'}`}>
            <img
              src="/images/hero-dress.png"
              alt="I Wear by Areej"
              className="w-full h-auto object-contain drop-shadow-[0_8px_32px_rgba(107,31,42,0.18)] transition-transform duration-500 ease-out hover:scale-[1.03]"
            />
          </div>

        </div>
      </div>
    </section>
  )
}

/* Home Page */
export default function HomePage() {
  const { t } = useLanguage()
  const { activeSeason } = useSiteSettings()
  const secondSeason = activeSeason === 'SUMMER' ? 'WINTER' : 'SUMMER'
  const [heroRef, heroInView] = useInView()

  return (
    <div className="bg-[#FDF6F7] pb-12 overflow-x-hidden">
      <Hero innerRef={heroRef} inView={heroInView} t={t} activeSeason={activeSeason} />
      <div className="space-y-6 sm:space-y-8 py-6 sm:py-8">
        <CategorySection />
        <NewArrivalsSection season={activeSeason} />
        <BestSellersSection season={activeSeason} />
        <SeasonalSection season={activeSeason} />
        <SeasonalSection season={secondSeason} />
      </div>
    </div>
  )
}
