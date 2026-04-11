import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../../api/categoryApi'
import { useLanguage } from '../../context/LanguageContext'
import Spinner from '../ui/Spinner'


/**
 * Reusable "Shop by Category" section.
 *
 *  - Fetches categories from the existing GET /api/categories on mount.
 *  - Displays them as a responsive grid: 2 columns on mobile, scaling up to
 *    5 on large screens. Each card has the category image (or a graceful
 *    placeholder when missing) and the category name.
 *  - Click → /products?category={id} (matches the param ProductsPage already
 *    reads, so the filter applies immediately).
 *  - Empty state with a localized message when the API returns no categories.
 *  - Drop in anywhere via `<CategorySection />`. No props required, but
 *    `className` is forwarded to the outer <section> if you want to tweak
 *    spacing in a specific page.
 */
function CategoryCard({ cat, index }) {

  return (
    <Link
      to={`/products?category=${cat.id}`}
      className="group flex flex-col items-center text-center animate-fade-in-up w-full max-w-[180px] sm:max-w-[200px] overflow-visible opacity-0"
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
        {cat.imageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden rounded-full">
            <img
              src={cat.imageUrl}
              alt={cat.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#DFA3AD]">
            <svg className="w-10 h-10 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4z" />
            </svg>
          </div>
        )}

        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-[#1A0A0D]/15 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      <span
        className="mt-4 text-[13px] sm:text-[15px] font-semibold tracking-[0.10em] text-[#3D1218]
                   group-hover:text-[#6B1F2A] transition-all duration-200"
        style={{
          fontFamily: 'Playfair Display, serif',
          textShadow: '0 1px 3px rgba(107,31,42,0.15), 0 0 8px rgba(255,255,255,0.5)',
        }}
      >
        {cat.name}
      </span>
    </Link>
  )
}

export default function CategorySection({ className = '' }) {
  const { t, isRTL } = useLanguage()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getCategories()
      .then(res => { if (!cancelled) setCategories(res.data?.data ?? []) })
      .catch(() => { if (!cancelled) setCategories([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <section className={`relative px-6 sm:px-8 lg:px-12 py-10 sm:py-12 lg:py-14 max-w-6xl mx-auto ${className}`}>

      {/* ── Title ──────────────────────────────────────────── */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-block bg-[#F3E4E7] px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#6B1F2B] leading-none tracking-[0.04em] sm:tracking-[0.06em] inline-flex items-center gap-2.5"
              style={{ fontFamily: 'Playfair Display, serif' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DFA3AD] opacity-70" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#DFA3AD] opacity-45" />
            </span>
            {t('home.shopByCategory')}
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DFA3AD] opacity-45" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#DFA3AD] opacity-70" />
            </span>
          </h2>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : categories.length === 0 ? (
        <p className="text-center py-10 text-sm text-[#9B7B80] tracking-wide">
          {t('home.noCategories')}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 lg:gap-x-10 lg:gap-y-12 justify-items-center max-w-4xl mx-auto">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.id} cat={cat} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}
