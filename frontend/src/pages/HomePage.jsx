import { Link } from 'react-router-dom'
import CategorySection from '../components/category/CategorySection'
import NewArrivalsSection from '../components/product/NewArrivalsSection'
import BestSellersSection from '../components/product/BestSellersSection'
import useInView from '../hooks/useInView'
import { useLanguage } from '../context/LanguageContext'

/* ── Hero ───────────────────────────────────────────────────────────────── */
function Hero({ innerRef, inView, t }) {
  return (
    <section ref={innerRef} className="bg-[#F2E0E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-12 sm:py-16 lg:py-20">

        {/* Mobile: column (image top, text bottom)
            Desktop: row (text left, image right) */}
        <div className="flex flex-row items-center gap-10 sm:gap-12 lg:gap-20">

          {/* ── Text ───────────────────────────────────────── */}
          <div className={`flex-1 min-w-0 text-start ${inView ? 'animate-fade-in-up' : 'opacity-0'}`}>

            <h1 style={{ fontFamily: 'Playfair Display, Cormorant Garamond, serif' }}>
              <span
                className="block text-[52px] sm:text-[64px] lg:text-[88px] font-bold leading-[0.85] tracking-[0.05em] text-[#6B1F2A]"
                style={{ fontStyle: 'italic' }}
              >
                I Wear
              </span>
              <span
                className="block text-[28px] sm:text-[36px] lg:text-[48px] font-light leading-[1.1] mt-2 tracking-[0.03em] text-[#9B7B80]"
                style={{ fontStyle: 'italic' }}
              >
                by Areej
              </span>
            </h1>

            <div className="flex items-center gap-3 mt-5 mb-5 lg:mt-6 lg:mb-6">
              <div className="h-px w-8 sm:w-12 bg-[#DFA3AD]/60" />
              <span className="text-[8px] sm:text-[9px] tracking-[0.35em] uppercase text-[#C4A0A6] font-semibold"
                    style={{ fontFamily: 'Raleway, sans-serif' }}>
                Boutique
              </span>
              <div className="h-px w-8 sm:w-12 bg-[#DFA3AD]/60" />
            </div>

            <p className="text-[13px] lg:text-[15px] text-[#9B7B80] leading-[1.7] max-w-[340px] font-light tracking-wide hidden sm:block sm:mx-0 mx-auto">
              {t('home.newArrivalsDesc')}
            </p>

            <div className="flex items-center gap-4 sm:gap-5 mt-7 sm:mt-9">
              <Link to="/products"
                className="group inline-flex items-center gap-2.5 bg-[#6B1F2A] text-white text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] uppercase px-7 sm:px-9 py-3 sm:py-4 rounded-full shadow-[0_4px_20px_rgba(107,31,42,0.25)] hover:bg-[#551820] hover:shadow-[0_6px_28px_rgba(107,31,42,0.35)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300">
                {t('home.shopNow')}
                <svg className="w-3.5 h-3.5 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link to="/products"
                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.18em] uppercase text-[#6B1F2A] hover:text-[#3D1A1E] transition-colors duration-300">
                {t('home.viewAll')}
                <svg className="w-3 h-3 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* ── Image in oval ──────────────────────────────── */}
          <div className={`shrink-0 w-36 sm:w-52 lg:w-64 ${inView ? 'animate-fade-in delay-150' : 'opacity-0'}`}>
            <div
              className="w-full aspect-[3/4] overflow-hidden"
              style={{
                borderRadius: '50%',
                border: '3px solid #6B1F2B',
                boxShadow: '0 14px 44px rgba(107,31,42,0.13), 0 0 0 6px rgba(107,31,42,0.05)',
              }}
            >
              <img
                src="/images/hero-model.jpg"
                alt="I Wear by Areej"
                className="w-full h-full object-cover object-top"
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
