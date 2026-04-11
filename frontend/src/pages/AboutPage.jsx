import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useSiteSettings } from '../context/SiteSettingsContext'

/**
 * About Us page.
 *
 * Sections:
 *   1. Hero      — title + subtitle, decorative floral background
 *   2. Who we are — narrative paragraph
 *   3. Our mission — accented strip with icon
 *   4. Why choose us — three feature cards
 *   5. CTA       — invite to shop the collection
 *
 * Reuses the existing site palette / typography (Cormorant Garamond serif
 * for headings, Raleway eyebrows, rose accents) and is fully RTL-friendly
 * via centered, mirror-symmetric layouts.
 */
export default function AboutPage() {
  const { t } = useLanguage()
  const { siteName } = useSiteSettings()

  const features = [
    {
      title: t('about.feature1Title'),
      desc:  t('about.feature1Desc'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    {
      title: t('about.feature2Title'),
      desc:  t('about.feature2Desc'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    {
      title: t('about.feature3Title'),
      desc:  t('about.feature3Desc'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      ),
    },
  ]

  return (
    <div className="bg-[#FDF6F7]">

      {/* ── 1. Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#F0D5D8]">
        {/* Soft decorative background */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <svg className="absolute -top-16 -start-16 w-72 h-72 opacity-[0.08] animate-float-slow" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="90" stroke="#6B1F2A" strokeWidth="0.6"/>
            <circle cx="100" cy="100" r="60" stroke="#DFA3AD" strokeWidth="0.6"/>
            <circle cx="100" cy="100" r="30" stroke="#6B1F2A" strokeWidth="0.6"/>
          </svg>
          <svg className="absolute -bottom-20 -end-16 w-80 h-80 opacity-[0.07] animate-sway" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="95" stroke="#DFA3AD" strokeWidth="0.6"/>
            <circle cx="100" cy="100" r="65" stroke="#6B1F2A" strokeWidth="0.6"/>
          </svg>
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-[#DFA3AD] opacity-30 animate-float"
              style={{
                left: `${10 + i * 13}%`,
                top:  `${15 + (i % 3) * 24}%`,
                animationDelay:    `${i * 0.7}s`,
                animationDuration: `${4 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-20 sm:py-28 text-center">
          <p className="text-[10px] tracking-[0.32em] uppercase text-[#DFA3AD] mb-4 animate-fade-in"
             style={{ fontFamily: 'Raleway, sans-serif' }}>
            ✦ {t('about.eyebrow')} ✦
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-light text-[#3D1A1E] mb-5 animate-fade-in-up"
              style={{ fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.05 }}>
            {t('about.title')}
          </h1>

          <div className="h-0.5 w-20 mx-auto mb-6 animate-fade-in-up delay-100"
               style={{ background: 'linear-gradient(90deg, transparent, #DFA3AD, transparent)' }} />

          <p className="text-base sm:text-lg text-[#9B7B80] max-w-2xl mx-auto leading-relaxed tracking-wide animate-fade-in-up delay-200">
            {t('about.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* ── 2. Who we are ────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-24 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#DFA3AD] mb-3"
           style={{ fontFamily: 'Raleway, sans-serif' }}>
          01
        </p>
        <h2 className="text-3xl sm:text-4xl font-light text-[#6B1F2A] mb-4"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t('about.whoWeAreTitle')}
        </h2>
        <div className="h-0.5 w-12 mx-auto mb-7" style={{ background: '#DFA3AD' }} />
        <p className="text-[15px] text-[#6B4E53] leading-loose tracking-wide">
          {t('about.whoWeAreText').replace('{siteName}', siteName)}
        </p>
      </section>

      {/* ── 3. Our mission ───────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-[#FDF0F2] to-[#F9E8EB] border-y border-[#F0D5D8]">
        <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-[#F0D5D8] mb-6 shadow-sm">
            <svg className="w-7 h-7 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>

          <p className="text-[10px] tracking-[0.3em] uppercase text-[#DFA3AD] mb-3"
             style={{ fontFamily: 'Raleway, sans-serif' }}>
            02
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-[#6B1F2A] mb-4"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('about.missionTitle')}
          </h2>
          <div className="h-0.5 w-12 mx-auto mb-7" style={{ background: '#DFA3AD' }} />

          <p className="text-[15px] text-[#6B4E53] leading-loose tracking-wide">
            {t('about.missionText')}
          </p>
        </div>
      </section>

      {/* ── 4. Why choose us ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#DFA3AD] mb-3"
             style={{ fontFamily: 'Raleway, sans-serif' }}>
            03
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-[#6B1F2A] mb-3"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('about.whyChooseTitle')}
          </h2>
          <div className="h-0.5 w-12 mx-auto mb-4" style={{ background: '#DFA3AD' }} />
          <p className="text-sm text-[#9B7B80] tracking-wide">
            {t('about.whyChooseSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-[#F0D5D8] p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(107,31,42,0.10)]"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FDF0F2] to-[#F5DCE0] border border-[#F0D5D8] mb-5">
                <svg className="w-6 h-6 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  {f.icon}
                </svg>
              </div>
              <h3 className="text-xl font-light text-[#3D1A1E] mb-2"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {f.title}
              </h3>
              <p className="text-sm text-[#9B7B80] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. CTA ───────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #6B1F2A 0%, #8B2535 60%, #A33040 100%)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute right-0 top-0 w-56 h-56 rounded-full opacity-10 -translate-y-1/3 translate-x-1/3"
                 style={{ background: '#DFA3AD' }} />
            <div className="absolute left-0 bottom-0 w-40 h-40 rounded-full opacity-10 translate-y-1/3 -translate-x-1/3"
                 style={{ background: '#EDD8DC' }} />
          </div>

          <div className="relative px-6 sm:px-12 py-14 sm:py-16 text-center">
            <p className="text-[10px] tracking-[0.32em] uppercase text-[#EDD8DC]/75 mb-3"
               style={{ fontFamily: 'Raleway, sans-serif' }}>
              ✦ {t('about.ctaEyebrow')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-white tracking-wide mb-3"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('about.ctaTitle')}
            </h2>
            <p className="text-sm text-[#F9C8CF] mb-7 max-w-md mx-auto">
              {t('about.ctaSubtitle')}
            </p>
            <Link
              to="/products"
              className="inline-block bg-white text-[#6B1F2A] text-xs tracking-[0.18em] uppercase px-9 py-3.5 rounded-full font-semibold hover:bg-[#F9E8EB] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300"
            >
              {t('home.shopNow')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
