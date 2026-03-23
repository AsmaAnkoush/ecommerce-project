import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProducts, searchProducts, getSeasonProducts } from '../api/productApi'
import { getCategories } from '../api/categoryApi'
import ProductCard from '../components/product/ProductCard'
import Spinner from '../components/ui/Spinner'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Pink', 'Gray', 'Brown', 'Beige']

const SEASONS = [
  { value: 'SUMMER',     label: '☀️ صيف',        activeClass: 'bg-amber-500 text-white border-amber-500' },
  { value: 'WINTER',     label: '❄️ شتاء',        activeClass: 'bg-sky-500 text-white border-sky-500' },
  { value: 'ALL_SEASON', label: '🌸 كل المواسم',  activeClass: 'bg-emerald-600 text-white border-emerald-600' },
]

function FilterPanel({ categories, searchParams, setFilter, clearFilters, hasFilters }) {
  const categoryId = searchParams.get('category') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const color = searchParams.get('color') || ''
  const size = searchParams.get('size') || ''
  const season = searchParams.get('season') || ''

  return (
    <div className="space-y-6">
      {/* Season */}
      <div>
        <h3 className="text-xs font-semibold text-[#9B7B80] uppercase tracking-widest mb-3">الموسم</h3>
        <div className="flex flex-col gap-1">
          {SEASONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter('season', season === opt.value ? '' : opt.value)}
              className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors border ${
                season === opt.value
                  ? opt.activeClass
                  : 'border-transparent text-[#6B3840] hover:bg-[#FDF0F2]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold text-[#9B7B80] uppercase tracking-widest mb-3">الفئات</h3>
        <ul className="space-y-1">
          <li>
            <button onClick={() => setFilter('category', '')}
              className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors ${!categoryId ? 'bg-[#6B1F2A] text-white' : 'text-[#6B3840] hover:bg-[#FDF0F2]'}`}>
              الكل
            </button>
          </li>
          {categories.map(cat => (
            <li key={cat.id}>
              <button onClick={() => setFilter('category', cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${String(cat.id) === categoryId ? 'bg-[#6B1F2A] text-white' : 'text-[#6B3840] hover:bg-[#FDF0F2]'}`}>
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-xs font-semibold text-[#9B7B80] uppercase tracking-widest mb-3">السعر</h3>
        <div className="space-y-2">
          <input type="number" placeholder="الحد الأدنى $" value={minPrice}
            onChange={e => setFilter('minPrice', e.target.value)}
            className="w-full px-3 py-2 border border-[#EDD8DC] rounded-lg text-sm focus:outline-none focus:border-[#6B1F2A] bg-[#FDF6F7]" />
          <input type="number" placeholder="الحد الأقصى $" value={maxPrice}
            onChange={e => setFilter('maxPrice', e.target.value)}
            className="w-full px-3 py-2 border border-[#EDD8DC] rounded-lg text-sm focus:outline-none focus:border-[#6B1F2A] bg-[#FDF6F7]" />
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="text-xs font-semibold text-[#9B7B80] uppercase tracking-widest mb-3">المقاس</h3>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map(s => (
            <button key={s} onClick={() => setFilter('size', size === s ? '' : s)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${size === s ? 'bg-[#6B1F2A] text-white border-[#6B1F2A]' : 'border-[#EDD8DC] text-[#6B3840] hover:border-[#6B1F2A]'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="text-xs font-semibold text-[#9B7B80] uppercase tracking-widest mb-3">اللون</h3>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map(c => (
            <button key={c} onClick={() => setFilter('color', color === c ? '' : c)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${color === c ? 'bg-[#6B1F2A] text-white border-[#6B1F2A]' : 'border-[#EDD8DC] text-[#6B3840] hover:border-[#6B1F2A]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button onClick={clearFilters} className="text-sm text-[#6B1F2A] hover:text-[#8B2535] font-medium tracking-wide">
          مسح الـ Filter
        </button>
      )}
    </div>
  )
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ totalPages: 0, totalElements: 0, number: 0 })
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('category') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const color = searchParams.get('color') || ''
  const size = searchParams.get('size') || ''
  const season = searchParams.get('season') || ''
  const page = parseInt(searchParams.get('page') || '0')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let res
      if (season) {
        res = await getSeasonProducts(season)
        const list = res.data?.data ?? []
        setProducts(list)
        setPagination({ totalPages: 0, totalElements: list.length, number: 0 })
        return
      }
      if (search) {
        res = await searchProducts(search, { page, size: 12 })
      } else {
        const params = { page, size: 12, sortBy: 'createdAt', sortDir: 'desc' }
        if (categoryId) params.categoryId = categoryId
        if (minPrice) params.minPrice = minPrice
        if (maxPrice) params.maxPrice = maxPrice
        if (color) params.color = color
        if (size) params.size_filter = size
        res = await getProducts(params)
      }
      const data = res.data.data ?? {}
      setProducts(data.content ?? [])
      setPagination({ totalPages: data.totalPages ?? 0, totalElements: data.totalElements ?? 0, number: data.number ?? 0 })
    } finally { setLoading(false) }
  }, [search, categoryId, minPrice, maxPrice, color, size, season, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { getCategories().then(r => setCategories(r.data.data ?? [])).catch(() => {}) }, [])

  const setFilter = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchParams({})
    setFilterOpen(false)
  }

  const setPage = (p) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', p)
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeCategory = categories.find(c => String(c.id) === categoryId)
  const hasFilters = !!(categoryId || minPrice || maxPrice || color || size || season)
  const activeFilterCount = [categoryId, minPrice, maxPrice, color, size, season].filter(Boolean).length
  const seasonLabel = season === 'SUMMER' ? '☀️ كوليكشن الصيف'
    : season === 'WINTER' ? '❄️ كوليكشن الشتاء'
    : season === 'ALL_SEASON' ? '🌸 كل المواسم'
    : ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1
          className="text-2xl sm:text-3xl font-semibold tracking-wide text-[#3D1A1E]"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          {season ? seasonLabel : search ? `نتائج: "${search}"` : activeCategory ? activeCategory.name : 'جميع المنتجات'}
        </h1>
        {pagination.totalElements > 0 && (
          <p className="text-sm text-[#9B7B80] mt-1 font-light tracking-wider">{pagination.totalElements} منتج</p>
        )}
      </div>

      {/* Mobile filter bar */}
      <div className="md:hidden flex items-center justify-between mb-4 gap-3">
        <button
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-[#EDD8DC] rounded-full text-sm text-[#6B1F2A] bg-white hover:bg-[#FDF0F2] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filter
          {activeFilterCount > 0 && (
            <span className="bg-[#6B1F2A] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-[#9B7B80] hover:text-[#6B1F2A] transition-colors">
            مسح
          </button>
        )}
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <aside className="absolute end-0 top-0 h-full w-[280px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0D5D8]">
              <h3 className="text-sm font-semibold text-[#3D1A1E] tracking-wide uppercase" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Filter
              </h3>
              <button onClick={() => setFilterOpen(false)} className="text-[#9B7B80] hover:text-[#6B1F2A] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FilterPanel
                categories={categories}
                searchParams={searchParams}
                setFilter={setFilter}
                clearFilters={clearFilters}
                hasFilters={hasFilters}
              />
            </div>
            <div className="px-5 py-4 border-t border-[#F0D5D8]">
              <button
                onClick={() => setFilterOpen(false)}
                className="w-full bg-[#6B1F2A] text-white py-2.5 rounded-full text-sm font-medium tracking-wider hover:bg-[#8B2535] transition-colors"
              >
                تطبيق Filter
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-52 shrink-0 space-y-6">
          <FilterPanel
            categories={categories}
            searchParams={searchParams}
            setFilter={setFilter}
            clearFilters={clearFilters}
            hasFilters={hasFilters}
          />
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-24"><Spinner size="lg" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-[#9B7B80] font-medium" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px' }}>لا يوجد منتجات</p>
              <p className="text-sm text-[#C4A8AE] mt-1 font-light">Try a different filter or search.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10 sm:mt-12 flex-wrap">
                  <button disabled={page === 0} onClick={() => setPage(page - 1)}
                    className="px-4 py-2 text-sm border border-[#EDD8DC] rounded-full text-[#6B1F2A] disabled:opacity-40 hover:bg-[#FDF0F2] transition-colors">
                    Previous
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i)}
                      className={`w-9 h-9 text-sm rounded-full transition-colors ${i === page ? 'bg-[#6B1F2A] text-white' : 'border border-[#EDD8DC] text-[#6B3840] hover:bg-[#FDF0F2]'}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button disabled={page === pagination.totalPages - 1} onClick={() => setPage(page + 1)}
                    className="px-4 py-2 text-sm border border-[#EDD8DC] rounded-full text-[#6B1F2A] disabled:opacity-40 hover:bg-[#FDF0F2] transition-colors">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
