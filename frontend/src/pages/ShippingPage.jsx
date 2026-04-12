import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useFormatPrice } from '../utils/formatPrice'

const WHATSAPP_NUMBER = '972594828117'
const FACEBOOK_URL    = 'https://www.facebook.com/iwear.boutique'
const INSTAGRAM_URL   = 'https://www.instagram.com/iwear1_boutique/'
const WHATSAPP_URL    = `https://wa.me/${WHATSAPP_NUMBER}`

const WHATSAPP_SVG = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

/* Shared section title — matches home-page BestSellers/NewArrivals pill heading */
function SectionTitle({ children }) {
  return (
    <div className="text-center mb-8 sm:mb-10">
      <div className="inline-block bg-[#F3E4E7] px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#6B1F2B] leading-none tracking-[0.04em] sm:tracking-[0.06em] inline-flex items-center gap-2.5"
            style={{ fontFamily: 'Playfair Display, serif' }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DFA3AD] opacity-70" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#DFA3AD] opacity-45" />
          </span>
          {children}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DFA3AD] opacity-45" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#DFA3AD] opacity-70" />
          </span>
        </h2>
      </div>
    </div>
  )
}

export default function ShippingPage() {
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()

  const SHIPPING_ZONES = [
    { region: t('shipping.westBank'),   price: 20, icon: '📦', accent: 'from-[#FDF0F2] to-[#F9DDE2]' },
    { region: t('shipping.jerusalem'),  price: 30, icon: '🏛️', accent: 'from-[#FDF6F7] to-[#F5D8DE]' },
    { region: t('shipping.inside48'),   price: 70, icon: '🚚', accent: 'from-[#F9EEF0] to-[#EEC9D0]' },
  ]

  const PAYMENT_METHODS = [
    { icon: '💵', title: t('shipping.codTitle'),  desc: t('shipping.codDesc')  },
    { icon: '📲', title: t('shipping.bankTitle'), desc: t('shipping.bankDesc') },
  ]

  const STEPS = [
    { num: '1', text: t('shipping.step1'), icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { num: '2', text: t('shipping.step2'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { num: '3', text: t('shipping.step3'), icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { num: '4', text: t('shipping.step4'), icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  ]

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
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-[#6B1F2B] tracking-[0.04em] sm:tracking-[0.06em] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('shipping.title')}
          </h1>
          <span className="inline-block h-px w-12 bg-gradient-to-r from-transparent via-[#DFA3AD] to-transparent" />
          <p className="text-xs sm:text-sm text-[#9B7B80] max-w-md mx-auto leading-relaxed font-light">
            {t('shipping.subtitle')}
          </p>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-16 space-y-16">

        {/* ── Fast-delivery highlight card ─────────────────────────── */}
        <div className="group relative bg-white rounded-3xl p-6 sm:p-8 border border-[#F0D5D8] shadow-[0_4px_20px_rgba(107,31,42,0.06)] hover:shadow-[0_16px_48px_rgba(107,31,42,0.16)] hover:-translate-y-1 hover:border-[#DFA3AD] transition-all duration-500 cursor-default overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#FDF0F2] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-5 sm:gap-6">
            <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#6B1F2A] to-[#8B2535] text-white text-3xl sm:text-4xl flex items-center justify-center shadow-[0_8px_24px_rgba(107,31,42,0.3)] group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-500">
              ⚡
            </div>
            <div className="flex-1">
              <p className="text-lg sm:text-xl font-semibold text-[#3D1A1E] mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {t('shipping.fastDelivery')}
              </p>
              <p className="text-xs sm:text-sm text-[#9B7B80] leading-relaxed">{t('shipping.afterWhatsApp')}</p>
            </div>
          </div>
        </div>

        {/* ── Shipping prices — card grid ──────────────────────────── */}
        <section>
          <SectionTitle>{t('shipping.shippingPrices')}</SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {SHIPPING_ZONES.map(z => (
              <div
                key={z.region}
                className="card-hover group relative bg-white rounded-2xl p-6 border border-[#F0D5D8] hover:border-[#DFA3AD] overflow-hidden"
                style={{ boxShadow: '0 2px 12px rgba(107,31,42,0.05)' }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${z.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FDF6F7] text-3xl mb-4 group-hover:scale-110 group-hover:bg-white transition-transform duration-400 shadow-[0_4px_12px_rgba(107,31,42,0.06)]">
                    {z.icon}
                  </div>
                  <p className="text-sm font-medium text-[#3D1A1E] tracking-wide mb-2">{z.region}</p>
                  <p className="text-2xl font-bold text-[#6B1F2A] nums-normal" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {formatPrice(z.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Payment methods — cards ──────────────────────────────── */}
        <section>
          <SectionTitle>{t('shipping.paymentMethod')}</SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {PAYMENT_METHODS.map(m => (
              <div
                key={m.title}
                className="card-hover group bg-white rounded-2xl p-6 border border-[#F0D5D8] hover:border-[#DFA3AD] flex items-start gap-4"
                style={{ boxShadow: '0 2px 12px rgba(107,31,42,0.05)' }}
              >
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FDF0F2] to-[#F9DDE2] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-400">
                  {m.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#3D1A1E] mb-1 tracking-wide">{m.title}</p>
                  <p className="text-xs text-[#9B7B80] leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works — order steps ───────────────────────────── */}
        <section>
          <SectionTitle>{t('shipping.howItWorks')}</SectionTitle>

          <div className="relative grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-3">
            {/* Connector line on desktop */}
            <div className="hidden sm:block absolute top-7 start-[12.5%] end-[12.5%] h-px bg-gradient-to-r from-[#DFA3AD]/20 via-[#DFA3AD]/60 to-[#DFA3AD]/20" />
            {STEPS.map((s, i) => (
              <div key={s.num} className="card-hover group relative bg-white rounded-2xl p-5 border border-[#F0D5D8] hover:border-[#DFA3AD] text-center"
                style={{ boxShadow: '0 2px 12px rgba(107,31,42,0.05)' }}>
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#6B1F2A] to-[#8B2535] text-white mb-3 shadow-[0_6px_18px_rgba(107,31,42,0.25)] group-hover:scale-110 transition-transform duration-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                  <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-white text-[10px] font-bold text-[#6B1F2A] flex items-center justify-center border border-[#DFA3AD] nums-normal">
                    {i + 1}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#3D1A1E] leading-snug">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── WhatsApp CTA ─────────────────────────────────────────── */}
        <section>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="card-hover group flex items-center gap-4 bg-white border border-[#F0D5D8] hover:border-[#DFA3AD] rounded-2xl px-5 py-4 sm:px-6 sm:py-5"
            style={{ boxShadow: '0 2px 12px rgba(107,31,42,0.05)' }}
          >
            <div className="shrink-0 w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors duration-300">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-emerald-500"><path d={WHATSAPP_SVG} /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#3D1A1E] leading-tight">WhatsApp</p>
              <p className="text-[11px] text-[#9B7B80] mt-0.5">{t('shipping.contactUs')}</p>
              <p className="text-xs text-[#6B4E53] mt-1 nums-normal" dir="ltr">+{WHATSAPP_NUMBER}</p>
            </div>
            <svg className="w-4 h-4 shrink-0 text-[#B08A90] rtl:rotate-180 group-hover:text-[#6B1F2A] group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Social secondary row */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white border border-[#F0D5D8] rounded-2xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-600"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              Facebook
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white border border-[#F0D5D8] rounded-2xl px-4 py-3 hover:border-pink-300 hover:bg-pink-50 transition-colors text-sm font-medium text-pink-700"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-pink-500"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              Instagram
            </a>
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────────────── */}
        <div className="text-center pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#6B1F2A] text-white text-xs font-semibold tracking-[0.2em] uppercase px-9 py-3.5 rounded-full shadow-[0_8px_24px_rgba(107,31,42,0.25)] hover:bg-[#551820] hover:shadow-[0_12px_32px_rgba(107,31,42,0.35)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
          >
            {t('shipping.shopNow')}
            <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
