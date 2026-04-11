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
export default function CategorySection({ className = '' }) {
  const { t } = useLanguage()
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
    <section className={`relative px-4 sm:px-6 py-14 sm:py-16 max-w-6xl mx-auto ${className}`}>

      {/* ── Title ──────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#DFA3AD] mb-3"
           style={{ fontFamily: 'Raleway, sans-serif' }}>
          ✦ {t('home.shopByCategoryEyebrow')}
        </p>
        <h2 className="text-3xl sm:text-4xl font-light text-[#3D1A1E]"
            style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
          {t('home.shopByCategory')}
        </h2>
        <div className="h-0.5 w-16 mx-auto mt-3"
             style={{ background: 'linear-gradient(90deg, transparent, #DFA3AD, transparent)' }} />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group flex flex-col items-center text-center animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i * 60, 360)}ms` }}
            >
              {/* Image / placeholder card */}
              <div
                className="relative w-full aspect-square rounded-3xl overflow-hidden border border-[#F0D5D8]
                           transition-all duration-300
                           group-hover:scale-[1.04] group-hover:shadow-[0_12px_32px_rgba(107,31,42,0.15)]
                           group-hover:border-[#DFA3AD]"
                style={{ background: 'linear-gradient(135deg, #FDF0F2 0%, #F5DCE0 100%)' }}
              >
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#DFA3AD]">
                    <svg className="w-10 h-10 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4z" />
                    </svg>
                  </div>
                )}

                {/* Subtle dark overlay on hover for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0D]/15 via-transparent to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              {/* Name */}
              <span
                className="mt-3 text-[12px] sm:text-sm font-medium tracking-wider text-[#6B3840]
                           group-hover:text-[#6B1F2A] transition-colors duration-200"
                style={{ fontFamily: 'Raleway, sans-serif' }}
              >
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
