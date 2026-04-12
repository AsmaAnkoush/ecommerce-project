import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOffers } from '../api/productApi'
import { useLanguage } from '../context/LanguageContext'
import ProductCard from '../components/product/ProductCard'
import Spinner from '../components/ui/Spinner'

export default function OffersPage() {
  const { t } = useLanguage()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getOffers()
      .then(res => { if (!cancelled) setOffers(res.data.data || []) })
      .catch(() => { if (!cancelled) setOffers([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

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
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-[#6B1F2B] tracking-[0.04em] sm:tracking-[0.06em] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('offers.title')}
          </h1>
          <span className="inline-block h-px w-12 bg-gradient-to-r from-transparent via-[#DFA3AD] to-transparent" />
          <p className="text-xs sm:text-sm text-[#9B7B80] max-w-md mx-auto leading-relaxed font-light">
            {t('offers.emptySub') /* reuse the soft boutique tagline */}
          </p>
          {!loading && offers.length > 0 && (
            <p className="text-[11px] text-[#9B7B80] tracking-wider nums-normal mt-1">
              {offers.length} {offers.length === 1 ? t('cart.item') : t('cart.items')}
            </p>
          )}
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-14">

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : offers.length === 0 ? (
          <div className="max-w-md mx-auto">
            <div
              className="card-hover bg-white border border-[#F0D5D8] rounded-2xl px-6 py-10 flex flex-col items-center text-center gap-4"
              style={{ boxShadow: '0 2px 12px rgba(107,31,42,0.05)' }}
            >
              <div className="w-14 h-14 rounded-full bg-[#FDF0F2] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-medium text-[#6B1F2B] tracking-[0.04em] mb-1.5" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {t('offers.empty')}
                </h2>
                <p className="text-xs sm:text-sm text-[#9B7B80] font-light leading-relaxed">
                  {t('offers.emptySub')}
                </p>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-[#6B1F2A] text-white text-xs font-semibold tracking-[0.2em] uppercase px-9 py-3.5 rounded-full shadow-[0_8px_24px_rgba(107,31,42,0.25)] hover:bg-[#551820] hover:shadow-[0_12px_32px_rgba(107,31,42,0.35)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 mt-2"
              >
                {t('home.shopNow')}
                <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {offers.map((product, idx) => (
              <div
                key={product.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(idx * 50, 400)}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
