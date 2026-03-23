import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getLatestProducts, getBestSellers, getOnSale, getSeasonProducts, getNewArrivals } from '../api/productApi'
import { getCategories } from '../api/categoryApi'
import { getSettings } from '../api/adminApi'
import ProductCard from '../components/product/ProductCard'
import Spinner from '../components/ui/Spinner'
import useInView from '../hooks/useInView'

/* ─────────────────────────── SVG helpers ─────────────────────────────── */

const FloralLeft = ({ className = '' }) => (
  <svg
    viewBox="0 0 70 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-14 h-36 opacity-70 ${className}`}
  >
    <g stroke="#E8B7BF" strokeWidth="1" fill="none">
      <path d="M38 155 Q36 125 40 95 Q38 65 36 35" strokeWidth="1.2"/>
      <circle cx="36" cy="27" r="4.5" stroke="#E8B7BF" strokeWidth="1"/>
      <path d="M36 23 Q31 16 27 18"/><path d="M36 23 Q42 16 44 18"/>
      <path d="M32 27 Q25 25 23 29"/><path d="M40 27 Q48 25 49 29"/>
      <circle cx="36" cy="27" r="2.2" fill="#E8B7BF" opacity="0.45"/>
      {/* petals */}
      <path d="M37 72 Q26 66 22 72 Q30 80 37 76" fill="#F9E8EB" stroke="#E8B7BF" strokeWidth="0.8"/>
      <path d="M39 96 Q52 90 54 96 Q46 104 39 100" fill="#F9E8EB" stroke="#E8B7BF" strokeWidth="0.8"/>
      <path d="M37 120 Q24 113 20 119 Q28 129 37 124" fill="#F9E8EB" stroke="#E8B7BF" strokeWidth="0.8"/>
      {/* small buds */}
      <circle cx="28" cy="50" r="3" stroke="#DFA3AD" strokeWidth="0.8"/>
      <path d="M28 47 Q24 42 26 38"/>
      <circle cx="26" cy="38" r="1.8" fill="#DFA3AD" opacity="0.5"/>
      <circle cx="47" cy="60" r="2.5" stroke="#DFA3AD" strokeWidth="0.8"/>
      <path d="M47 57 Q51 52 49 48"/>
      <circle cx="49" cy="48" r="1.5" fill="#DFA3AD" opacity="0.4"/>
    </g>
  </svg>
)


/* ── Category icon SVGs ───────────────────────────────────────────────── */
const IconDress = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <path d="M8 3h8"/>
    <path d="M8 3 5 7 3 8v2l3 1v11h12V11l3-1V8l-2-1-3-4"/>
    <path d="M8 3 7 7M16 3l1 4"/>
  </svg>
)
const IconAbaya = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <circle cx="12" cy="4" r="2.2"/>
    <path d="M12 6.2 C7.5 6.2 6 9 6 11L5 21h14L18 11C18 9 16.5 6.2 12 6.2Z"/>
    <path d="M6 11 3 9M18 11l3-2"/>
  </svg>
)
const IconHijab = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <circle cx="12" cy="7" r="4"/>
    <path d="M7 7 C5 9 4 13 4 16 C4 19.5 6 21 8 21.5"/>
    <path d="M17 7 C19 9 20 13 20 16 C20 19.5 18 21 16 21.5"/>
    <path d="M8.5 7 Q10 5 12 5"/>
  </svg>
)
const IconAccessories = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <path d="M3 6h18"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
)
const IconDefault = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <path d="M20.4 18H3.6L12 9l8.4 9z"/>
    <path d="M12 9V4"/>
    <path d="M9 4a3 3 0 006 0"/>
  </svg>
)

function CategoryIcon({ name = '' }) {
  const n = name.toLowerCase()
  if (n.includes('dress'))  return <IconDress />
  if (n.includes('abaya'))  return <IconAbaya />
  if (n.includes('hijab') || n.includes('scarf')) return <IconHijab />
  if (n.includes('access') || n.includes('bag') || n.includes('jewel')) return <IconAccessories />
  return <IconDefault />
}

const FALLBACK_CATEGORIES = [
  { id: 'dresses',     name: 'Dresses',     icon: <IconDress /> },
  { id: 'abayas',      name: 'Abayas',      icon: <IconAbaya /> },
  { id: 'hijabs',      name: 'Hijabs',      icon: <IconHijab /> },
  { id: 'accessories', name: 'Accessories', icon: <IconAccessories /> },
]

/* ─────────────────────────── Component ───────────────────────────────── */
const SEASON_META = {
  SUMMER: {
    label: 'كوليكشن الصيف',
    otherLabel: 'استعري كوليكشن الشتاء',
    otherSeason: 'WINTER',
    heroBg: 'linear-gradient(135deg, #FFF3C4 0%, #FFE082 50%, #FFCA28 100%)',
    accent: '#E65100',
    otherBg: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)',
    otherAccent: '#1565C0',
    icon: '☀️',
    otherIcon: '❄️',
    tagline: 'أقمشة خفيفة وألوان زاهية وأناقة بلا تعقيد',
    otherTagline: 'طبقات دافئة وأقمشة فاخرة لشتاء مميز',
  },
  WINTER: {
    label: 'كوليكشن الشتاء',
    otherLabel: 'استعري كوليكشن الصيف',
    otherSeason: 'SUMMER',
    heroBg: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)',
    accent: '#1565C0',
    otherBg: 'linear-gradient(135deg, #FFF3C4 0%, #FFE082 50%, #FFCA28 100%)',
    otherAccent: '#E65100',
    icon: '❄️',
    otherIcon: '☀️',
    tagline: 'طبقات دافئة وأقمشة فاخرة لشتاء مميز',
    otherTagline: 'أقمشة خفيفة وألوان زاهية وأناقة بلا تعقيد',
  },
}

export default function HomePage() {
  const navigate = useNavigate()
  const [latest,        setLatest]        = useState([])
  const [newArrivals,   setNewArrivals]   = useState([])
  const [bestSellers,   setBestSellers]   = useState([])
  const [onSale,        setOnSale]        = useState([])
  const [categories,    setCategories]    = useState([])
  const [activeSeason,  setActiveSeason]  = useState(null)   // 'SUMMER' | 'WINTER'
  const [seasonProducts, setSeasonProducts] = useState([])
  const [otherProducts, setOtherProducts] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [searchQ,       setSearchQ]       = useState('')

  const [heroRef,     heroInView]     = useInView()
  const [arrivalsRef, arrivalsInView] = useInView()
  const [gridRef,     gridInView]     = useInView()
  const [catRef,      catInView]      = useInView()
  const [bestRef,     bestInView]     = useInView()
  const [offersRef,   offersInView]   = useInView()
  const [seasonRef,   seasonInView]   = useInView()
  const [otherRef,    otherInView]    = useInView()

  useEffect(() => {
    Promise.all([
      getLatestProducts(), getCategories(), getBestSellers(), getOnSale(), getSettings(), getNewArrivals(),
    ]).then(([latestRes, catRes, bestRes, saleRes, settingsRes, newRes]) => {
        setLatest(latestRes.data?.data ?? [])
        setNewArrivals(newRes.data?.data ?? [])
        setCategories(catRes.data?.data ?? [])
        setBestSellers(bestRes.data?.data ?? [])
        setOnSale(saleRes.data?.data ?? [])
        const season = settingsRes.data?.data?.activeSeason ?? 'SUMMER'
        setActiveSeason(season)
        const other = season === 'SUMMER' ? 'WINTER' : 'SUMMER'
        return Promise.all([getSeasonProducts(season), getSeasonProducts(other)])
      }).then(([activeRes, otherRes]) => {
        setSeasonProducts(activeRes.data?.data ?? [])
        setOtherProducts(otherRes.data?.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQ.trim()) navigate(`/products?search=${encodeURIComponent(searchQ.trim())}`)
    else navigate('/products')
  }

  const displayCategories = categories.length > 0
    ? categories.map(c => ({ ...c, icon: <CategoryIcon name={c.name} /> }))
    : FALLBACK_CATEGORIES

  return (
    <div className="bg-[#FDF6F7] pb-12">

      {/* ══ SEARCH BAR ════════════════════════════════════════════ */}
      <div className="bg-white px-4 sm:px-6 py-3 border-b border-[#F9E8EB]">
        <form onSubmit={handleSearch} className="max-w-lg lg:max-w-2xl mx-auto">
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-[#EDD8DC] bg-[#FDF6F7]"
            style={{ boxShadow: '0 1px 4px rgba(107,31,42,0.05)' }}
          >
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="ابحثي عن فستان، عباية، حجاب..."
              className="flex-1 bg-transparent text-[12.5px] text-[#3D1A1E] placeholder-[#C4A8AE] outline-none"
              style={{ fontFamily: 'Raleway, sans-serif' }}
            />
            <button
              type="submit"
              className="text-[#C4A0A6] hover:text-[#6B1F2A] transition-colors flex-shrink-0"
              aria-label="Search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 pt-4 pb-5 max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto" ref={heroRef}>
        <div
          className={`relative rounded-[20px] overflow-hidden min-h-[290px] sm:min-h-[340px] lg:min-h-[420px] xl:min-h-[480px] ${heroInView ? 'animate-fade-in-scale' : 'opacity-0'}`}
          style={{
            background: 'linear-gradient(130deg, #F0C8D0 0%, #E8B4BF 40%, #DCAAB4 100%)',
          }}
        >
          {/* "i wear by arrej" text – bottom-left */}
          <div className="absolute bottom-8 left-7 z-10">
            <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 0.82 }}>
              <span style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 'clamp(140px, 22vw, 260px)',
                lineHeight: 0.82,
                color: 'rgba(255,255,255,1)',
                letterSpacing: '-.02em',
                textShadow: '0 8px 48px rgba(84,22,31,.25)',
              }}>I</span>
              <span style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontWeight: 400,
                fontStyle: 'italic',
                fontSize: 'clamp(90px, 15vw, 170px)',
                lineHeight: 0.82,
                color: '#5C1E2E',
                letterSpacing: '.02em',
                opacity: 0.75,
                alignSelf: 'flex-end',
                paddingBottom: 8,
              }}>wear</span>
            </div>
            <p
              className={`text-[15px] sm:text-[18px] lg:text-[22px] italic mt-1 ${heroInView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`}
              style={{ fontFamily: 'Cormorant Garamond, serif', color: 'rgba(255,255,255,0.82)' }}
            >
              {'by arrej'}
            </p>
          </div>

          {/* Real dress photo – right side, full height of card */}
          <div
            className={`absolute right-0 top-0 h-full flex items-end justify-end
              ${heroInView ? 'animate-fade-in delay-100' : 'opacity-0'}`}
            style={{ width: '58%' }}
          >
            <img
              src="/images/hero-dress.jpg"
              alt="i wear by arrej – featured dress"
              className="h-full w-full object-cover object-top"
              style={{ objectPosition: 'center top' }}
            />
          </div>

          {/* Gradient fade so text stays readable over image */}
          <div
            className="absolute inset-0 z-[5]"
            style={{
              background: 'linear-gradient(to right, rgba(240,200,208,0.95) 28%, rgba(240,200,208,0.55) 55%, rgba(240,200,208,0) 80%)',
            }}
          />
        </div>
      </section>

      {/* ══ DIVIDER ═══════════════════════════════════════════════ */}
      <Divider />

      {/* ══ NEW ARRIVALS ══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 pt-8 pb-4 max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto" ref={arrivalsRef}>
        <div className="flex items-start gap-3 lg:gap-6">

          {/* Floral left illustration */}
          <div className={`flex-shrink-0 -mt-3 animate-sway ${arrivalsInView ? 'animate-fade-in delay-100' : 'opacity-0'}`}>
            <FloralLeft className="w-14 h-36 lg:w-20 lg:h-52" />
          </div>

          {/* Text + CTA */}
          <div className={`pt-2 ${arrivalsInView ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
            <h2
              className="text-[26px] sm:text-[32px] lg:text-[40px] font-semibold tracking-wide text-[#3D1A1E] leading-tight"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}
            >
              {'وصل جديد'}
            </h2>
            <p className="text-[11.5px] sm:text-[13px] lg:text-[15px] text-[#9B7B80] font-light mt-2 leading-relaxed max-w-[200px] sm:max-w-[280px] lg:max-w-sm">
              {'أحدث تشكيلاتنا من الفساتين والعبايات والحجاب'}
            </p>
            <Link
              to="/products"
              className="mt-4 inline-block bg-[#6B1F2A] text-white text-[11px] lg:text-xs tracking-widest uppercase px-6 py-2.5 lg:px-8 lg:py-3 rounded-lg
                hover:bg-[#8B2535] hover:shadow-lg hover:-translate-y-0.5
                transition-all duration-300 btn-press"
            >
              {'تسوّقي الآن'}
            </Link>
          </div>
        </div>
      </section>

      {/* ══ PRODUCT GRID (New Arrivals → fallback Latest) ════════ */}
      <section className="px-4 sm:px-6 pb-8 max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto" ref={gridRef}>
        {loading ? (
          <div className="flex justify-center py-14">
            <Spinner size="lg" />
          </div>
        ) : (() => {
          const displayProducts = newArrivals.length > 0 ? newArrivals : latest
          return displayProducts.length === 0 ? (
            <p className="text-center py-12 text-[#9B7B80] text-sm font-light tracking-wider">
              {'لا يوجد منتجات بعد'}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
                {displayProducts.slice(0, 6).map((p, i) => (
                  <div
                    key={p.id}
                    className={gridInView ? 'animate-fade-in-up' : 'opacity-0'}
                    style={{ animationDelay: `${i * 75}ms` }}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
              <div className={`text-center mt-7 ${gridInView ? 'animate-fade-in delay-600' : 'opacity-0'}`}>
                <Link
                  to="/products"
                  className="inline-block border border-[#DFA3AD] text-[#6B1F2A] text-[11px] tracking-widest px-8 py-2.5 rounded-full
                    hover:bg-[#F9E8EB] hover:border-[#6B1F2A] hover:shadow-md hover:-translate-y-0.5
                    transition-all duration-300 btn-press"
                >
                  {'عرض الكل'}
                </Link>
              </div>
            </>
          )
        })()}
      </section>

      {/* ══ DIVIDER ═══════════════════════════════════════════════ */}
      <Divider />

      {/* ══ SHOP BY CATEGORY ══════════════════════════════════════ */}
      <section className="pt-8 pb-10 px-4 sm:px-6" ref={catRef}>
        <h2
          className={`text-center mb-6 lg:mb-8 ${catInView ? 'animate-fade-in-up' : 'opacity-0'}`}
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(22px, 3vw, 32px)',
            fontStyle: 'italic',
            fontWeight: 400,
            color: '#6B1F2A',
            letterSpacing: '0.04em',
          }}
        >
          {'تسوّقي حسب الفئة'}
        </h2>

        <div className={`grid gap-3 sm:gap-4 lg:gap-6 max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto ${
          displayCategories.length <= 3 ? 'grid-cols-3' :
          displayCategories.length === 4 ? 'grid-cols-4' :
          displayCategories.length === 5 ? 'grid-cols-5' :
          'grid-cols-4 sm:grid-cols-6'
        }`}>
          {displayCategories.map((cat, i) => (
            <Link
              key={cat.id}
              to={typeof cat.id === 'number' ? `/products?category=${cat.id}` : `/products?search=${cat.name}`}
              className={`flex flex-col items-center gap-2 group ${catInView ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${100 + i * 80}ms` }}
            >
              {/* Icon / image circle */}
              <div
                className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] lg:w-20 lg:h-20 xl:w-24 xl:h-24 rounded-full overflow-hidden flex items-center justify-center text-[#C4768B]
                  transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #FDF0F2 0%, #F7E0E5 100%)', border: '1px solid #EDD8DC' }}
              >
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="[&>svg]:w-7 [&>svg]:h-7 lg:[&>svg]:w-9 lg:[&>svg]:h-9 xl:[&>svg]:w-10 xl:[&>svg]:h-10">
                    {cat.icon}
                  </span>
                )}
              </div>
              {/* Label */}
              <span
                className="text-[11px] sm:text-[12px] lg:text-sm text-[#6B3840] text-center leading-tight tracking-wide group-hover:text-[#6B1F2A] transition-colors"
                style={{ fontFamily: 'Raleway, sans-serif' }}
              >
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ DIVIDER ═══════════════════════════════════════════════ */}
      <Divider />

      {/* ══ BEST SELLERS ══════════════════════════════════════════ */}
      {bestSellers.length > 0 && (
        <>
          <section className="px-4 sm:px-6 pt-8 pb-4 max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto" ref={bestRef}>
            <div className="flex items-start gap-3 lg:gap-6 justify-end">
              {/* Text + CTA (right-aligned for visual variety) */}
              <div className={`pt-2 text-right flex-1 ${bestInView ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
                <h2
                  className="text-[26px] sm:text-[32px] lg:text-[40px] font-semibold tracking-wide text-[#3D1A1E] leading-tight"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}
                >
                  {'الأكثر مبيعاً'}
                </h2>
                <p className="text-[11.5px] sm:text-[13px] lg:text-[15px] text-[#9B7B80] font-light mt-2 leading-relaxed ms-auto max-w-[200px] sm:max-w-[280px] lg:max-w-sm">
                  {'قطع تحبّها عميلاتنا'}
                </p>
                <Link
                  to="/products?bestSeller=true"
                  className="mt-4 inline-block bg-[#6B1F2A] text-white text-[11px] lg:text-xs tracking-widest uppercase px-6 py-2.5 lg:px-8 lg:py-3 rounded-lg
                    hover:bg-[#8B2535] hover:shadow-lg hover:-translate-y-0.5
                    transition-all duration-300 btn-press"
                >
                  {'عرض الكل'}
                </Link>
              </div>
              {/* Star icon right */}
              <div className={`flex-shrink-0 -mt-3 ${bestInView ? 'animate-fade-in delay-100' : 'opacity-0'}`}>
                <svg viewBox="0 0 70 160" fill="none" className="w-14 h-36 lg:w-20 lg:h-52 opacity-60">
                  <g stroke="#E8B7BF" strokeWidth="1" fill="none">
                    <path d="M32 155 Q34 125 30 95 Q32 65 34 35" strokeWidth="1.2"/>
                    <path d="M32 27 L32 19 L26 23 L32 15 L38 23 L32 19" stroke="#DFA3AD" strokeWidth="1"/>
                    <circle cx="32" cy="15" r="3.5" stroke="#E8B7BF" strokeWidth="1"/>
                    <path d="M33 72 Q44 66 48 72 Q40 80 33 76" fill="#F9E8EB" stroke="#E8B7BF" strokeWidth="0.8"/>
                    <path d="M31 96 Q18 90 16 96 Q24 104 31 100" fill="#F9E8EB" stroke="#E8B7BF" strokeWidth="0.8"/>
                    <path d="M33 120 Q46 113 50 119 Q42 129 33 124" fill="#F9E8EB" stroke="#E8B7BF" strokeWidth="0.8"/>
                    <circle cx="42" cy="50" r="3" stroke="#DFA3AD" strokeWidth="0.8"/>
                    <path d="M42 47 Q46 42 44 38"/>
                    <circle cx="44" cy="38" r="1.8" fill="#DFA3AD" opacity="0.5"/>
                  </g>
                </svg>
              </div>
            </div>
          </section>

          {/* Best Sellers grid */}
          <section className="px-4 sm:px-6 pb-8 max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
              {bestSellers.slice(0, 4).map((p, i) => (
                <div
                  key={p.id}
                  className={bestInView ? 'animate-fade-in-up' : 'opacity-0'}
                  style={{ animationDelay: `${i * 75}ms` }}
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>

          <Divider />
        </>
      )}

      {/* ══ ACTIVE SEASON COLLECTION ══════════════════════════════ */}
      {activeSeason && seasonProducts.length > 0 && (() => {
        const meta = SEASON_META[activeSeason]
        return (
          <>
            <section className="px-4 sm:px-6 pt-8 pb-4 max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto" ref={seasonRef}>
              {/* Season header banner */}
              <div
                className={`relative overflow-hidden rounded-2xl mb-6 ${seasonInView ? 'animate-fade-in-scale' : 'opacity-0'}`}
                style={{ background: meta.heroBg }}
              >
                <div className="px-6 py-6 sm:px-10 sm:py-8 flex items-center gap-4">
                  <span className="text-5xl sm:text-6xl flex-shrink-0">{meta.icon}</span>
                  <div>
                    <h2
                      className="text-[22px] sm:text-[28px] lg:text-[34px] font-semibold leading-tight"
                      style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: meta.accent }}
                    >
                      {meta.label}
                    </h2>
                    <p className="text-[12px] sm:text-sm font-light mt-1" style={{ color: meta.accent, opacity: 0.75 }}>
                      {meta.tagline}
                    </p>
                  </div>
                  <Link
                    to={`/products?season=${activeSeason}`}
                    className="ml-auto flex-shrink-0 text-[11px] tracking-widest uppercase px-5 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 btn-press"
                    style={{ background: meta.accent, color: '#fff' }}
                  >
                    تسوّقي الكل
                  </Link>
                </div>
              </div>

              {/* Product grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
                {seasonProducts.slice(0, 4).map((p, i) => (
                  <div
                    key={p.id}
                    className={seasonInView ? 'animate-fade-in-up' : 'opacity-0'}
                    style={{ animationDelay: `${i * 75}ms` }}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </section>
            <Divider />
          </>
        )
      })()}

      {/* ══ SPECIAL OFFERS ════════════════════════════════════════ */}
      {onSale.length > 0 && (
        <>
          <section className="px-4 sm:px-6 py-8 max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto" ref={offersRef}>
            {/* Offer banner */}
            <div
              className={`relative overflow-hidden rounded-2xl ${offersInView ? 'animate-fade-in-scale' : 'opacity-0'}`}
              style={{ background: 'linear-gradient(135deg, #F7DCE0 0%, #EFC8CF 50%, #E8B7BF 100%)' }}
            >
              <div className="px-6 py-7 sm:px-10 sm:py-9 lg:px-14 lg:py-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
                  <div className="flex-1">
                    <span
                      className="inline-block bg-[#6B1F2A] text-white text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-3"
                      style={{ fontFamily: 'Raleway, sans-serif' }}
                    >
                      Limited Time
                    </span>
                    <h2
                      className="text-[24px] sm:text-[30px] lg:text-[38px] font-semibold text-[#3D1A1E] leading-tight"
                      style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}
                    >
                      {'SPECIAL OFFERS'}
                    </h2>
                    <p className="text-[12px] sm:text-sm text-[#9B7B80] font-light mt-2 max-w-xs">
                      {'Exclusive deals on our finest collections'}
                    </p>
                    <Link
                      to="/products?sale=true"
                      className="mt-5 inline-block bg-[#6B1F2A] text-white text-[11px] tracking-widest uppercase px-7 py-2.5 rounded-lg
                        hover:bg-[#8B2535] hover:shadow-lg hover:-translate-y-0.5
                        transition-all duration-300 btn-press"
                    >
                      {'Shop the Sale'}
                    </Link>
                  </div>

                  {/* Mini product preview strip */}
                  <div className="flex gap-2 sm:gap-3 shrink-0">
                    {onSale.slice(0, 3).map(p => {
                      const pct = p.discountPrice ? Math.round((1 - p.discountPrice / p.price) * 100) : 0
                      return (
                        <Link key={p.id} to={`/products/${p.id}`} className="relative group">
                          <div className="w-[72px] h-[90px] sm:w-20 sm:h-24 lg:w-24 lg:h-28 rounded-xl overflow-hidden bg-white/60 shadow-sm">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full bg-[#EDD8DC]" />
                            )}
                          </div>
                          {pct > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-[#6B1F2A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              -{pct}%
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Decorative dots */}
              <div className="absolute top-3 right-3 opacity-20">
                <svg viewBox="0 0 60 60" className="w-16 h-16 text-[#6B1F2A]">
                  {[0,1,2,3].map(row => [0,1,2,3].map(col => (
                    <circle key={`${row}-${col}`} cx={col * 15 + 7} cy={row * 15 + 7} r="2" fill="currentColor" />
                  )))}
                </svg>
              </div>
            </div>
          </section>

          <Divider />
        </>
      )}

      {/* ══ OTHER SEASON TEASER ═══════════════════════════════════ */}
      {activeSeason && otherProducts.length > 0 && (() => {
        const meta = SEASON_META[activeSeason]
        return (
          <>
            <section className="px-4 sm:px-6 py-8 max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto" ref={otherRef}>
              <div
                className={`relative overflow-hidden rounded-2xl ${otherInView ? 'animate-fade-in-scale' : 'opacity-0'}`}
                style={{ background: meta.otherBg }}
              >
                <div className="px-6 py-7 sm:px-10 sm:py-9 lg:px-14 lg:py-12">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
                    <div className="flex-1">
                      <span
                        className="text-3xl sm:text-4xl block mb-2"
                      >{meta.otherIcon}</span>
                      <h2
                        className="text-[22px] sm:text-[28px] lg:text-[34px] font-semibold leading-tight"
                        style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: meta.otherAccent }}
                      >
                        {meta.otherLabel}
                      </h2>
                      <p className="text-[12px] sm:text-sm font-light mt-1.5 max-w-xs" style={{ color: meta.otherAccent, opacity: 0.75 }}>
                        {meta.otherTagline}
                      </p>
                      <Link
                        to={`/products?season=${meta.otherSeason}`}
                        className="mt-5 inline-block text-[11px] tracking-widest uppercase px-7 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 btn-press"
                        style={{ background: meta.otherAccent, color: '#fff' }}
                      >
                        Explore Collection
                      </Link>
                    </div>

                    {/* Mini product thumbnails */}
                    <div className="flex gap-2 sm:gap-3 shrink-0">
                      {otherProducts.slice(0, 3).map(p => (
                        <Link key={p.id} to={`/products/${p.id}`} className="group">
                          <div className="w-[72px] h-[90px] sm:w-20 sm:h-24 lg:w-24 lg:h-28 rounded-xl overflow-hidden bg-white/60 shadow-sm">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full" style={{ background: 'rgba(255,255,255,0.4)' }} />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <Divider />
          </>
        )
      })()}

      {/* ══ ELEGANT CTA BANNER ════════════════════════════════════ */}
      <section className="px-4 sm:px-6 max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto">
        <div
          className="rounded-2xl overflow-hidden animate-fade-in-scale"
          style={{ background: 'linear-gradient(135deg, #6B1F2A 0%, #8B2535 100%)' }}
        >
          <div className="px-6 py-7 sm:px-10 sm:py-10 lg:px-16 lg:py-14 text-center">
            <h2
              className="text-[22px] sm:text-[28px] lg:text-[36px] font-light text-white tracking-widest mb-2"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {'Timeless Elegance'}
            </h2>
            <p className="text-[#F9C8CF] text-xs sm:text-sm font-light tracking-wider mb-5">
              {'Modest fashion crafted with love'}
            </p>
            <Link
              to="/register"
              className="inline-block bg-white text-[#6B1F2A] text-xs tracking-widest px-7 py-2.5 lg:px-10 lg:py-3 rounded-full font-medium
                hover:bg-[#F9E8EB] hover:shadow-xl hover:-translate-y-1
                transition-all duration-300 btn-press"
            >
              {'Join Us'}
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

/* ── Animated divider ─────────────────────────────────────────────────── */
function Divider() {
  const [ref, inView] = useInView()
  return (
    <div className="flex items-center gap-3 px-8 max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto" ref={ref}>
      <div className={`flex-1 h-px bg-[#E8B7BF] origin-left ${inView ? 'animate-draw-line' : 'scale-x-0'}`} />
      <span className={`text-[#DFA3AD] text-xs ${inView ? 'animate-fade-in delay-400' : 'opacity-0'}`}>✦</span>
      <div className={`flex-1 h-px bg-[#E8B7BF] origin-right ${inView ? 'animate-draw-line delay-200' : 'scale-x-0'}`} />
    </div>
  )
}
