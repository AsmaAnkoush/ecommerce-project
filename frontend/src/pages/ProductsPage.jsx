import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProducts, searchProducts, getSeasonProducts, getProductsBySeasonId } from '../api/productApi'
import { getCategories } from '../api/categoryApi'
import ProductCard from '../components/product/ProductCard'
import ProductRow from '../components/product/ProductRow'
import Spinner from '../components/ui/Spinner'
import ProductSkeleton from '../components/ui/ProductSkeleton'
import { useLanguage } from '../context/LanguageContext'

/* ── Sort options ─────────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: 'newest',     labelKey: 'products.sortNewest',    sortBy: 'createdAt', sortDir: 'desc' },
  { value: 'oldest',     labelKey: 'products.sortOldest',    sortBy: 'createdAt', sortDir: 'asc'  },
  { value: 'price-asc',  labelKey: 'products.sortPriceAsc',  sortBy: 'price',     sortDir: 'asc'  },
  { value: 'price-desc', labelKey: 'products.sortPriceDesc', sortBy: 'price',     sortDir: 'desc' },
]
const DEFAULT_SORT = 'newest'

function clientSort(list, sortBy, sortDir) {
  const sorted = [...list]
  sorted.sort((a, b) => {
    let av, bv
    if (sortBy === 'price') {
      av = Number(a.discountPrice ?? a.price ?? 0)
      bv = Number(b.discountPrice ?? b.price ?? 0)
    } else {
      av = new Date(a.createdAt || 0).getTime()
      bv = new Date(b.createdAt || 0).getTime()
    }
    return sortDir === 'asc' ? av - bv : bv - av
  })
  return sorted
}

/* ── View mode persistence ────────────────────────────────────────────── */
const VIEW_KEY = 'productsViewMode'
function loadViewMode() {
  try { return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid' } catch { return 'grid' }
}

/* ── SVG glyphs ───────────────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)
const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const SortIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5M17 8l4 4-4 4" />
  </svg>
)
const ChevronDown = ({ open }) => (
  <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
       fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#6B1F2A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)
const ListIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
const PrevArrow = () => (
  <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)
const NextArrow = () => (
  <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

/* ═══════════════════════════════════════════════════════════════════════ */
export default function ProductsPage() {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ totalPages: 0, totalElements: 0, number: 0 })
  const [loading, setLoading] = useState(true)

  const [viewMode, setViewMode] = useState(loadViewMode)
  useEffect(() => { try { localStorage.setItem(VIEW_KEY, viewMode) } catch {} }, [viewMode])

  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef(null)
  useEffect(() => {
    if (!sortOpen) return
    const onClick = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setSortOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [sortOpen])

  /* Mobile price panel toggle */
  const [priceOpen, setPriceOpen] = useState(false)

  /* ── URL params ──────────────────────────────────────────────────────── */
  const search     = searchParams.get('search')   || ''
  const categoryId = searchParams.get('category') || ''
  const minPrice   = searchParams.get('minPrice') || ''
  const maxPrice   = searchParams.get('maxPrice') || ''
  const color      = searchParams.get('color')    || ''
  const size       = searchParams.get('size')     || ''
  const season     = searchParams.get('season')   || ''
  const sortValue  = searchParams.get('sort')     || DEFAULT_SORT
  const page       = parseInt(searchParams.get('page') || '0')
  const currentSort = SORT_OPTIONS.find(o => o.value === sortValue) || SORT_OPTIONS[0]

  const [searchInput, setSearchInput] = useState(search)
  const [minInput, setMinInput] = useState(minPrice)
  const [maxInput, setMaxInput] = useState(maxPrice)
  useEffect(() => { setSearchInput(search) }, [search])
  useEffect(() => { setMinInput(minPrice) }, [minPrice])
  useEffect(() => { setMaxInput(maxPrice) }, [maxPrice])

  /* ── Data fetching ───────────────────────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { sortBy, sortDir } = currentSort
      let list = [], pageMeta = { totalPages: 0, totalElements: 0, number: 0 }
      // season param is either a numeric ID (from SeasonCircle) or an enum string
      const isSeasonId = season && /^\d+$/.test(season)
      const effectiveSeason = season
      if (isSeasonId) {
        const res = await getProductsBySeasonId(season)
        list = res.data?.data ?? []
        pageMeta = { totalPages: 0, totalElements: list.length, number: 0 }
        list = clientSort(list, sortBy, sortDir)
      } else if (effectiveSeason) {
        const res = await getSeasonProducts(effectiveSeason)
        list = res.data?.data ?? []
        pageMeta = { totalPages: 0, totalElements: list.length, number: 0 }
        list = clientSort(list, sortBy, sortDir)
      } else if (search) {
        const res = await searchProducts(search, { page, size: 12 })
        const data = res.data.data ?? {}
        list = data.content ?? []
        pageMeta = { totalPages: data.totalPages ?? 0, totalElements: data.totalElements ?? 0, number: data.number ?? 0 }
        list = clientSort(list, sortBy, sortDir)
      } else {
        const params = { page, size: 12, sortBy, sortDir }
        if (categoryId) params.categoryId = categoryId
        if (minPrice) params.minPrice = minPrice
        if (maxPrice) params.maxPrice = maxPrice
        if (color) params.color = color
        if (size) params.size_filter = size
        const res = await getProducts(params)
        const data = res.data.data ?? {}
        list = data.content ?? []
        pageMeta = { totalPages: data.totalPages ?? 0, totalElements: data.totalElements ?? 0, number: data.number ?? 0 }
      }
      setProducts(list)
      setPagination(pageMeta)
    } finally { setLoading(false) }
  }, [search, categoryId, minPrice, maxPrice, color, size, season, page, currentSort])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { getCategories().then(r => setCategories(r.data.data ?? [])).catch(() => {}) }, [])

  /* ── Filter setters (unchanged) ──────────────────────────────────────── */
  const setFilter = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value); else params.delete(key)
    params.delete('page')
    setSearchParams(params)
  }
  const clearFilters = () => setSearchParams({})
  const setPageNum = (p) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', p)
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleSearchSubmit = (e) => { e.preventDefault(); setFilter('search', searchInput.trim()) }
  const clearSearch = () => { setSearchInput(''); setFilter('search', '') }
  const applyPrice = () => {
    const params = new URLSearchParams(searchParams)
    if (minInput) params.set('minPrice', minInput); else params.delete('minPrice')
    if (maxInput) params.set('maxPrice', maxInput); else params.delete('maxPrice')
    params.delete('page')
    setSearchParams(params)
  }
  const clearPrice = () => {
    setMinInput(''); setMaxInput('')
    const params = new URLSearchParams(searchParams)
    params.delete('minPrice'); params.delete('maxPrice'); params.delete('page')
    setSearchParams(params)
  }
  const handleSortSelect = (value) => { setFilter('sort', value === DEFAULT_SORT ? '' : value); setSortOpen(false) }

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const activeCategory = categories.find(c => String(c.id) === categoryId)
  const hasFilters = !!(search || categoryId || minPrice || maxPrice || color || size || season)
  const hasPriceFilter = !!(minPrice || maxPrice)
  const seasonLabel = season === 'SUMMER' ? t('products.summerCollection') : season === 'WINTER' ? t('products.winterCollection') : season === 'ALL_SEASON' ? t('products.allSeason') : ''
  const pageTitle = season ? seasonLabel : search ? t('products.results').replace('{query}', search) : activeCategory ? activeCategory.name : t('products.allProducts')

  /* ── Shared sub-components (render helpers) ──────────────────────────── */
  const searchField = (
    <form onSubmit={handleSearchSubmit} role="search" className="relative w-full md:w-80 lg:w-96">
      <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-[#C4A0A6] pointer-events-none"><SearchIcon /></span>
      <input
        type="search"
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full ps-12 pe-12 py-3 rounded-full bg-white border border-[#EDD8DC] text-sm text-[#3D1A1E] placeholder:text-[#C4A0A6] outline-none transition-all duration-200 focus:border-[#DFA3AD] focus:ring-2 focus:ring-[#DFA3AD]/20 shadow-[0_2px_12px_rgba(107,31,42,0.04)]"
      />
      {searchInput && (
        <button type="button" onClick={clearSearch} aria-label={t('common.close')}
          className="absolute inset-y-0 end-0 flex items-center pe-4 text-[#C4A0A6] hover:text-[#6B1F2A] transition-colors">
          <CloseIcon />
        </button>
      )}
    </form>
  )

  const sortDropdown = (
    <div className="relative" ref={sortRef}>
      <button type="button" onClick={() => setSortOpen(v => !v)} aria-haspopup="menu" aria-expanded={sortOpen}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#EDD8DC] bg-white text-xs text-[#6B1F2A] hover:bg-[#FDF0F2] hover:border-[#DFA3AD] transition-all duration-200 shadow-[0_1px_4px_rgba(107,31,42,0.05)] whitespace-nowrap">
        <SortIcon />
        <span className="font-medium tracking-wide">{t(currentSort.labelKey)}</span>
        <ChevronDown open={sortOpen} />
      </button>
      {sortOpen && (
        <div role="menu" className="absolute start-0 mt-2 z-50 min-w-[240px] bg-white border border-[#F0D5D8] rounded-2xl shadow-[0_8px_32px_rgba(107,31,42,0.12)] p-1.5 animate-fade-in-scale">
          {SORT_OPTIONS.map(opt => {
            const isActive = currentSort.value === opt.value
            return (
              <button key={opt.value} role="menuitemradio" aria-checked={isActive}
                onClick={() => handleSortSelect(opt.value)}
                className={[
                  'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs text-start transition-colors duration-150',
                  isActive ? 'bg-[#FDF0F2] text-[#6B1F2A] font-semibold' : 'text-[#6B3840] hover:bg-[#FDF0F2]/70 hover:text-[#6B1F2A]',
                ].join(' ')}>
                <span className="tracking-wide">{t(opt.labelKey)}</span>
                {isActive && <CheckIcon />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  const viewToggle = (
    <div className="inline-flex items-center bg-white border border-[#EDD8DC] rounded-full p-1 shadow-[0_1px_4px_rgba(107,31,42,0.05)]">
      {[
        { mode: 'grid', icon: <GridIcon />, label: t('products.gridView') },
        { mode: 'list', icon: <ListIcon />, label: t('products.listView') },
      ].map(v => (
        <button key={v.mode} type="button" onClick={() => setViewMode(v.mode)}
          aria-label={v.label} aria-pressed={viewMode === v.mode} title={v.label}
          className={[
            'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200',
            viewMode === v.mode ? 'bg-[#6B1F2A] text-white shadow-[0_2px_8px_rgba(107,31,42,0.25)]' : 'text-[#9B7B80] hover:text-[#6B1F2A]',
          ].join(' ')}>
          {v.icon}
        </button>
      ))}
    </div>
  )

  const priceInputs = (
    <div className="flex flex-col items-center gap-3">
      {/* Label */}
      <span className="text-sm text-[#9B7B80]">
        {t('products.price')}
      </span>

      {/* Inputs */}
      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="numeric"
          placeholder={t('products.from')}
          value={minInput}
          onChange={e => setMinInput(e.target.value)}
          onBlur={applyPrice}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyPrice() } }}
          className="w-28 px-3 py-2 border border-[#EDD8DC] rounded-lg text-center text-sm text-[#3D1A1E] placeholder:text-[#C4A0A6] outline-none focus:border-[#DFA3AD] focus:ring-2 focus:ring-[#DFA3AD]/20 transition-all bg-white"
        />
        <span className="text-[#C4A0A6]">—</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder={t('products.to')}
          value={maxInput}
          onChange={e => setMaxInput(e.target.value)}
          onBlur={applyPrice}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyPrice() } }}
          className="w-28 px-3 py-2 border border-[#EDD8DC] rounded-lg text-center text-sm text-[#3D1A1E] placeholder:text-[#C4A0A6] outline-none focus:border-[#DFA3AD] focus:ring-2 focus:ring-[#DFA3AD]/20 transition-all bg-white"
        />
      </div>

      {/* Clear (only visible when a price filter is active) */}
      {hasPriceFilter && (
        <button type="button" onClick={clearPrice}
          className="text-xs text-[#9B7B80] hover:text-[#6B1F2A] underline underline-offset-2 decoration-[#DFA3AD] transition-colors">
          {t('products.clearFilters')}
        </button>
      )}
    </div>
  )

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">

      {/* ── Categories container ───────────────────────────────────── */}
      <div className="bg-white/60 border border-[#F0D5D8] rounded-2xl px-4 sm:px-5 py-4 sm:py-5 mb-8 shadow-[0_2px_12px_rgba(107,31,42,0.04)]">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1 justify-start md:justify-center md:flex-wrap md:gap-y-3">
          <CategoryPill label={t('products.all')} active={!categoryId} onClick={() => setFilter('category', '')} />
          {categories.map(cat => (
            <CategoryPill key={cat.id} label={cat.name} active={String(cat.id) === categoryId} onClick={() => setFilter('category', cat.id)} />
          ))}
        </div>
      </div>
      {/* ── /Categories container ──────────────────────────────────── */}

      {/* ──────────────────────────────────────────────────────────────
          § 4  PAGE HEADER — title + inline count
         ────────────────────────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between gap-4 mb-8 mt-2 pb-5 border-b border-[#F0D5D8]">
        <h1 className="text-2xl sm:text-3xl font-light text-[#3D1A1E]"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {pageTitle}
          <span className="text-base sm:text-lg text-[#9B7B80] font-light ms-2 nums-normal">
            ({pagination.totalElements} {pagination.totalElements === 1 ? t('products.productCountSingular') : t('products.productCountPlural')})
          </span>
        </h1>
        {hasFilters && (
          <button onClick={clearFilters}
            className="inline-flex items-center gap-1 text-[10px] text-[#9B7B80] hover:text-[#6B1F2A] transition-colors tracking-wide shrink-0">
            <CloseIcon /> {t('products.clearAll')}
          </button>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────
          § 4b  TOOLBAR — sort + price + view toggle (just above grid)
         ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#F0D5D8] rounded-2xl px-4 sm:px-5 py-4 mb-6 shadow-[0_2px_12px_rgba(107,31,42,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Sort + view toggle */}
          <div className="flex items-center gap-2.5">
            {sortDropdown}
            {viewToggle}
          </div>

          {/* Desktop inline price inputs */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs text-[#9B7B80] shrink-0">{t('products.price')}</span>
            <input type="number" inputMode="numeric" placeholder={t('products.from')} value={minInput}
              onChange={e => setMinInput(e.target.value)} onBlur={applyPrice}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyPrice() } }}
              className="w-24 px-3 py-2 border border-[#EDD8DC] rounded-lg text-center text-sm text-[#3D1A1E] placeholder:text-[#C4A0A6] outline-none focus:border-[#DFA3AD] focus:ring-2 focus:ring-[#DFA3AD]/20 transition-all bg-white" />
            <span className="text-[#C4A0A6]">—</span>
            <input type="number" inputMode="numeric" placeholder={t('products.to')} value={maxInput}
              onChange={e => setMaxInput(e.target.value)} onBlur={applyPrice}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyPrice() } }}
              className="w-24 px-3 py-2 border border-[#EDD8DC] rounded-lg text-center text-sm text-[#3D1A1E] placeholder:text-[#C4A0A6] outline-none focus:border-[#DFA3AD] focus:ring-2 focus:ring-[#DFA3AD]/20 transition-all bg-white" />
            {hasPriceFilter && (
              <button type="button" onClick={clearPrice}
                className="text-xs text-[#9B7B80] hover:text-[#6B1F2A] underline underline-offset-2 decoration-[#DFA3AD] transition-colors shrink-0">
                {t('products.clearFilters')}
              </button>
            )}
          </div>

          {/* Mobile price toggle + collapsible panel */}
          <div className="md:hidden">
            <button type="button" onClick={() => setPriceOpen(v => !v)}
              className={[
                'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-xs transition-all duration-200',
                hasPriceFilter
                  ? 'bg-[#6B1F2A] text-white border-[#6B1F2A] shadow-sm'
                  : 'bg-white text-[#6B1F2A] border-[#EDD8DC] hover:bg-[#FDF0F2] hover:border-[#DFA3AD] shadow-[0_1px_4px_rgba(107,31,42,0.05)]',
              ].join(' ')}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{t('products.price')}</span>
              <ChevronDown open={priceOpen} />
            </button>
            {priceOpen && (
              <div className="mt-3 bg-[#FDF6F7] border border-[#F0D5D8] rounded-2xl px-4 py-4 animate-fade-in-scale">
                {priceInputs}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────
          § 5  PRODUCT GRID / LIST
         ────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 8 }, (_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center min-h-[55vh] px-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#FDF0F2] to-[#F9E0E5] flex items-center justify-center mb-6 shadow-[0_4px_20px_rgba(107,31,42,0.06)]">
            <svg className="w-11 h-11 sm:w-12 sm:h-12 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="font-light text-[#3D1A1E] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px' }}>
            {t('products.noProducts')}
          </h2>
          <p className="text-sm sm:text-base text-[#9B7B80] font-light max-w-md leading-relaxed mb-8">
            {t('products.tryDifferentFilter')}
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-7 py-3 bg-[#6B1F2A] text-white rounded-full text-xs font-medium tracking-[0.12em] uppercase hover:bg-[#8B2535] transition-colors shadow-[0_4px_16px_rgba(107,31,42,0.2)]"
          >
            {t('products.viewAllProducts')}
            <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {products.map((p, idx) => (
                <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:gap-4">
              {products.map((p, idx) => (
                <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>
                  <ProductRow product={p} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
              <button disabled={page === 0} onClick={() => setPageNum(page - 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs border border-[#EDD8DC] rounded-full text-[#6B1F2A] disabled:opacity-35 hover:bg-[#FDF0F2] transition-colors font-medium tracking-wide">
                <PrevArrow /> {t('products.previous')}
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <button key={i} onClick={() => setPageNum(i)}
                  className={[
                    'w-9 h-9 text-xs rounded-full transition-all duration-200 font-medium',
                    i === page ? 'bg-[#6B1F2A] text-white shadow-sm shadow-[#6B1F2A]/25' : 'border border-[#EDD8DC] text-[#6B3840] hover:bg-[#FDF0F2] hover:border-[#DFA3AD]',
                  ].join(' ')}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page === pagination.totalPages - 1} onClick={() => setPageNum(page + 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs border border-[#EDD8DC] rounded-full text-[#6B1F2A] disabled:opacity-35 hover:bg-[#FDF0F2] transition-colors font-medium tracking-wide">
                {t('products.next')} <NextArrow />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Category pill ──────────────────────────────────────────────────── */
function CategoryPill({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={[
        'shrink-0 inline-flex items-center px-5 py-2 rounded-full text-xs font-medium tracking-[0.08em] border transition-all duration-200',
        active
          ? 'bg-[#6B1F2A] text-white border-[#6B1F2A] shadow-[0_4px_14px_rgba(107,31,42,0.25)]'
          : 'bg-white text-[#6B3840] border-[#EDD8DC] hover:bg-[#FDF0F2] hover:border-[#DFA3AD] hover:text-[#6B1F2A]',
      ].join(' ')}>
      {label}
    </button>
  )
}
