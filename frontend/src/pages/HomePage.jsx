import { Link } from 'react-router-dom'
import CategorySection from '../components/category/CategorySection'
import NewArrivalsSection from '../components/product/NewArrivalsSection'
import BestSellersSection from '../components/product/BestSellersSection'
import useInView from '../hooks/useInView'
import { useLanguage } from '../context/LanguageContext'

/* ── Hero ───────────────────────────────────────────────────────────────── */
function Hero({ innerRef, inView, t }) {
  return (
    <section ref={innerRef} className="bg-[#F2E0E4] lg:min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-10 sm:py-14 lg:py-0 lg:min-h-screen lg:flex lg:items-center lg:pb-24">

        {/* Mobile: column (image top, text bottom)
            Desktop: row (text left, image right) */}
        <div className="flex flex-row items-center justify-center gap-6 sm:gap-10 lg:gap-55 w-full">
          {/* ── Text ───────────────────────────────────────── */}
          <div className={`max-w-[260px] sm:max-w-[360px] lg:max-w-[480px] min-w-0 text-left ${inView ? 'animate-fade-in-up' : 'opacity-0'}`}>

            <h1 style={{ fontFamily: 'Playfair Display, Cormorant Garamond, serif' }}>
              <span
                className="block text-[50px] sm:text-[68px] lg:text-[96px] font-bold leading-[1] tracking-[0.06em] text-[#5A1520] drop-shadow-[0_2px_4px_rgba(107,31,42,0.12)]"
                style={{ fontStyle: 'italic' }}
              >
                I Wear
              </span>
              <span
                className="block text-[20px] sm:text-[26px] lg:text-[32px] font-light leading-[1.1] mt-4 sm:mt-5 tracking-[0.05em] text-[#886A6F]"
                style={{ fontStyle: 'italic' }}
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
              <Link to="/products"
                className="group relative inline-flex items-center gap-2.5 bg-[#6B1F2A] text-white text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase px-8 sm:px-10 py-3.5 sm:py-4 rounded-full shadow-[0_4px_24px_rgba(107,31,42,0.3)] hover:bg-[#551820] hover:shadow-[0_8px_32px_rgba(107,31,42,0.4)] hover:scale-[1.04] active:scale-[0.97] transition-all duration-300 ease-out">
                {t('home.shopNow')}
                <svg className="w-3.5 h-3.5 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link to="/products"
                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.18em] uppercase text-[#6B1F2A] hover:text-[#3D1A1E] hover:tracking-[0.22em] transition-all duration-300">
                {t('home.viewAll')}
                <svg className="w-3 h-3 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* ── Image in oval ──────────────────────────────── */}
          <div className={`shrink-0 w-36 sm:w-48 lg:w-72 ${inView ? 'animate-fade-in delay-150' : 'opacity-0'}`}>
            <div
              className="w-full aspect-[3/4] overflow-hidden transition-transform duration-500 ease-out hover:scale-[1.03]"
              style={{
                borderRadius: '50%',
                border: '1.5px solid rgba(128,30,45,0.35)',
                boxShadow: '0 16px 48px rgba(107,31,42,0.14), 0 0 0 3px rgba(128,30,45,0.06), 0 0 60px rgba(107,31,42,0.05)',
              }}
            >
              <img
                src="/images/hero-model.jpg"
                alt="I Wear by Areej"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out hover:scale-[1.05]"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

/* Home Page */
export default function HomePage() {
  const { t } = useLanguage()
  const [heroRef, heroInView] = useInView()

  return (
    <div className="bg-[#FDF6F7] pb-8 overflow-x-hidden">
      <Hero innerRef={heroRef} inView={heroInView} t={t} />
      <CategorySection />
      <NewArrivalsSection />
      <BestSellersSection />
    </div>
  )
}
