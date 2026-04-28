import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

export default function SeasonalCollectionsBoxes() {
  const { t } = useLanguage()

  const collections = [
    {
      season: 'SUMMER',
      title: t('home.summerCollection') || 'Summer Collection',
      subtitle: t('home.summerSubtitle') || 'Light & Breezy',
      image: '/images/seasons/summer.jpg',
      gradient: 'from-[#FFD89B]/40 to-[#FF8FA3]/50',
    },
    {
      season: 'WINTER',
      title: t('home.winterCollection') || 'Winter Collection',
      subtitle: t('home.winterSubtitle') || 'Warm & Elegant',
      image: '/images/seasons/winter.jpg',
      gradient: 'from-[#6B1F2A]/50 to-[#3D1218]/60',
    },
  ]

  return (
    <section className="relative mx-3 sm:mx-5 lg:mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-12 lg:py-14 max-w-6xl">

      {/* ── Title (same unified style) ───────────────────── */}
      <div className="mb-8 sm:mb-12">
        <h2
          className="text-[24px] sm:text-[28px] lg:text-[42px] xl:text-[46px] leading-[1.2] inline-block"
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
          {t('home.shopBySeason') || 'Shop by Season'}
        </h2>

        <div className="flex items-center gap-2.5 mt-3 sm:mt-4">
          <span className="h-px w-10 sm:w-14 bg-[#6B1F2A]/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#6B1F2A]/60" />
          <span className="h-px w-10 sm:w-14 bg-[#6B1F2A]/50" />
        </div>
      </div>

      {/* ── Two boxes ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {collections.map((col) => (
          <Link
            key={col.season}
            to={`/products?season=${col.season}`}
            className="group relative block aspect-[4/3] sm:aspect-[3/4] lg:aspect-[4/5] rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(107,31,42,0.12)] hover:shadow-[0_16px_40px_rgba(107,31,42,0.25)] transition-all duration-500"
          >
            {/* Background image */}
            <img
              src={col.image}
              alt={col.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />

            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${col.gradient}`} />

            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors duration-500" />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-end items-start p-6 sm:p-8 lg:p-10">
              <span
                className="text-white/90 text-[10px] sm:text-[11px] lg:text-[12px] uppercase tracking-[0.3em] mb-2 sm:mb-3"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}
              >
                {col.subtitle}
              </span>

              <h3
                className="text-white text-[24px] sm:text-[30px] lg:text-[38px] xl:text-[44px] leading-[1] mb-3 sm:mb-4"
                style={{
                  fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
                  fontWeight: 500,
                  letterSpacing: '0.03em',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                {col.title}
              </h3>

              <span
                className="inline-flex items-center gap-2 text-white text-[10px] sm:text-[11px] lg:text-[12px] uppercase tracking-[0.22em] border-b border-white/60 pb-1 group-hover:border-white group-hover:gap-3 transition-all duration-300"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}
              >
                {t('home.explore') || 'Explore'}
                <svg className="w-3 h-3 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
