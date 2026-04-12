import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function AboutPage() {
  const { t } = useLanguage()

  const features = [
    {
      title: t('about.feature1Title'),
      desc:  t('about.feature1Desc'),
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      title: t('about.feature2Title'),
      desc:  t('about.feature2Desc'),
      icon: 'M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm5 10h4',
    },
    {
      title: t('about.feature3Title'),
      desc:  t('about.feature3Desc'),
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    },
  ]

  const cardStyle = { boxShadow: '0 2px 12px rgba(107,31,42,0.05)' }

  return (
    <div className="bg-[#FDF6F7]">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FDF6F7] to-[#F5E1E5]" />
        <div className="absolute -top-20 -end-20 w-56 h-56 rounded-full bg-[#DFA3AD] opacity-15 blur-3xl" />
        <div className="absolute -bottom-16 -start-16 w-64 h-64 rounded-full bg-[#E8B4BC] opacity-10 blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-10 text-center flex flex-col items-center gap-2">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-[0_3px_12px_rgba(107,31,42,0.1)]">
            <svg className="w-[18px] h-[18px] text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-[#6B1F2B] tracking-[0.04em] sm:tracking-[0.06em] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('about.title')}
          </h1>
          <span className="inline-block h-px w-12 bg-gradient-to-r from-transparent via-[#DFA3AD] to-transparent" />
          <p className="text-xs sm:text-sm text-[#9B7B80] max-w-md mx-auto leading-relaxed font-light">
            {t('about.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-14 space-y-10 sm:space-y-12">

        {/* Who we are — card */}
        <section
          className="card-hover bg-white border border-[#F0D5D8] hover:border-[#DFA3AD] rounded-2xl px-6 sm:px-8 py-8 sm:py-10"
          style={cardStyle}
        >
          <h2 className="text-xl sm:text-2xl font-medium text-[#6B1F2B] tracking-[0.04em] mb-3 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('about.whoWeAreTitle')}
          </h2>
          <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#DFA3AD] to-transparent mx-auto mb-5" />
          <p className="text-sm text-[#6B4E53] leading-relaxed text-center font-light">
            {(() => {
              const parts = t('about.whoWeAreText').split('{siteName}')
              return (
                <>
                  {parts[0]}
                  <span className="font-semibold text-[#6B1F2A]" style={{ fontFamily: 'Playfair Display, serif' }}>I Wear</span>
                  {parts[1]}
                </>
              )
            })()}
          </p>
        </section>

        {/* Mission — card with icon */}
        <section
          className="card-hover bg-white border border-[#F0D5D8] hover:border-[#DFA3AD] rounded-2xl px-6 sm:px-8 py-8 sm:py-10 flex flex-col items-center text-center"
          style={cardStyle}
        >
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#FDF0F2] border border-[#F0D5D8] mb-4">
            <svg className="w-5 h-5 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-medium text-[#6B1F2B] tracking-[0.04em] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('about.missionTitle')}
          </h2>
          <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#DFA3AD] to-transparent mb-5" />
          <p className="text-sm text-[#6B4E53] leading-relaxed font-light max-w-xl">
            {t('about.missionText')}
          </p>
        </section>

        {/* Why choose us — feature cards */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-medium text-[#6B1F2B] tracking-[0.04em] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('about.whyChooseTitle')}
            </h2>
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#DFA3AD] to-transparent mx-auto mb-3" />
            <p className="text-xs sm:text-sm text-[#9B7B80] font-light">
              {t('about.whyChooseSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="card-hover bg-white border border-[#F0D5D8] hover:border-[#DFA3AD] rounded-2xl p-6 text-center"
                style={cardStyle}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FDF0F2] border border-[#F0D5D8] mb-4">
                  <svg className="w-5 h-5 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-[#3D1A1E] mb-1.5 tracking-wide">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#9B7B80] leading-relaxed font-light">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-2">
          <p className="text-xs sm:text-sm text-[#9B7B80] mb-5 max-w-md mx-auto font-light">
            {t('about.ctaSubtitle')}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#6B1F2A] text-white text-xs font-semibold tracking-[0.2em] uppercase px-9 py-3.5 rounded-full shadow-[0_8px_24px_rgba(107,31,42,0.25)] hover:bg-[#551820] hover:shadow-[0_12px_32px_rgba(107,31,42,0.35)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
          >
            {t('home.shopNow')}
            <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
