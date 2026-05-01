import { Link } from 'react-router-dom'
import CategorySection from '../components/category/CategorySection'
import NewArrivalsSection from '../components/product/NewArrivalsSection'
import BestSellersSection from '../components/product/BestSellersSection'
import SeasonalCirclesSection from '../components/seasonal/SeasonalCirclesSection'
import useInView from '../hooks/useInView'
import { useLanguage } from '../context/LanguageContext'
import { useSiteSettings } from '../context/SiteSettingsContext'

/* ── Hero ───────────────────────────────────────────────────────────────── */
function Hero({ innerRef, inView, activeSeason }) {
  const shopHref = activeSeason ? `/products?season=${activeSeason}` : '/products'
  return (
    <section
      ref={innerRef}
      dir="ltr"
      className="relative bg-[#F5DCE2] overflow-hidden w-full"
      style={{ fontFamily: "'Montserrat', 'Poppins', sans-serif" }}
    >
      <div className="grid grid-cols-[50%_50%] lg:grid-cols-[45%_55%] h-[440px] sm:h-[540px] md:h-[600px] lg:h-[calc(100vh-100px)] lg:max-h-[640px] lg:min-h-[500px]">

        {/* ── Text Column ──────────────────────────────── */}
        <div
          className={`flex flex-col justify-center items-start pl-5 pr-2 sm:pl-10 sm:pr-4 md:pl-14 lg:pl-[10vw] lg:pr-2 xl:pl-[12vw] ${
            inView ? 'animate-fade-in-up' : 'opacity-0'
          }`}
        >
          {/* I WEAR + by Areej (SVG) */}
          <div className="flex flex-col items-stretch w-full sm:max-w-none">
            <svg
              viewBox="0 0 640 140"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-[320px] sm:max-w-[440px] md:max-w-[540px] lg:max-w-[520px] xl:max-w-[620px] 2xl:max-w-[700px] h-auto block"
              role="img"
              aria-label="I WEAR by Areej"
            >
              {/* I WEAR */}
              <text
                x="0"
                y="90"
                fill="#6B1F2A"
                style={{
                  fontFamily: "'Montserrat', 'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: '90px',
                  letterSpacing: '0.13em',
                }}
              >
                I WEAR
              </text>

              {/* By Areej - متداخل عند نهاية A */}
              <text
                x="305"
                y="115"
                fill="#C97A8A"
                style={{
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: '46px',
                  letterSpacing: '0.02em',
                }}
              >
                By Areej
              </text>
            </svg>
          </div>

          {/* Divider with BOUTIQUE */}
          <div className="flex items-center gap-2 sm:gap-3 mt-3.5 sm:mt-4 lg:mt-3 xl:mt-4 w-[150px] sm:w-[170px] lg:w-[170px] xl:w-[200px]">
            <div className="flex-1 h-px bg-[#6B1F2A]" />
            <span
              className="text-[#6B1F2A] text-[10px] sm:text-[10px] lg:text-[10px] xl:text-[11px] whitespace-nowrap"
              style={{
                fontFamily: "'Montserrat', 'Poppins', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.35em',
              }}
            >
              BOUTIQUE
            </span>
            <div className="flex-1 h-px bg-[#6B1F2A]" />
          </div>

          {/* Tagline */}
          <p
            className="text-[#5A2A2F] text-[11px] sm:text-[12px] lg:text-[12px] xl:text-[14px] leading-[1.5] mt-3 sm:mt-3 lg:mt-2.5 xl:mt-3 max-w-[180px] sm:max-w-[210px] lg:max-w-[220px] xl:max-w-[260px] text-left"
            style={{
              fontFamily: "'Montserrat', 'Poppins', sans-serif",
              fontWeight: 400,
              letterSpacing: '0.02em',
            }}
          >
            Discover our newest collection of dresses, abayas and skirts
          </p>

          {/* SHOP NOW Button */}
          <Link
            to={shopHref}
            className="hero-cta group inline-flex items-center gap-2 sm:gap-3 bg-[#6B1F2A] text-white rounded-full mt-3.5 sm:mt-4 lg:mt-3 xl:mt-4 px-4 py-2 sm:px-7 sm:py-3 lg:px-6 lg:py-2.5 xl:px-7 xl:py-3 text-[9px] sm:text-[11px] lg:text-[10px] xl:text-[12px] hover:bg-[#551820] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(107,31,42,0.35)] transition-all duration-300"
            style={{
              fontFamily: "'Montserrat', 'Poppins', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.22em',
            }}
          >
            SHOP NOW
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>

        {/* ── Image Column ─────────────────────────────── */}
        <div
          className={`relative h-full w-full overflow-hidden flex items-end justify-center ${
            inView ? 'animate-fade-in delay-150' : 'opacity-0'
          }`}
        >
          <img
            src="/images/hero-dress.png"
            alt="فستان برغندي أنيق من مجموعة I Wear by Areej"
            loading="eager"
            fetchpriority="high"
            className="h-full w-auto max-w-none object-contain object-bottom"
            style={{
              filter: 'drop-shadow(0 8px 20px rgba(107, 31, 42, 0.12))',
            }}
          />
        </div>

      </div>
    </section>
  )
}

/* Home Page */
export default function HomePage() {
  const { activeSeason } = useSiteSettings()
  const [heroRef, heroInView] = useInView()

  return (
    <div className="bg-[#FDF6F7] pb-12 overflow-x-hidden">
      <Hero innerRef={heroRef} inView={heroInView} activeSeason={activeSeason} />
      <div className="space-y-10 sm:space-y-14 lg:space-y-16 pt-8 sm:pt-10 lg:pt-12 pb-6">
        <CategorySection />
        <SeasonalCirclesSection />
        <NewArrivalsSection season={activeSeason} />
        <BestSellersSection season={activeSeason} />
      </div>
    </div>
  )
}