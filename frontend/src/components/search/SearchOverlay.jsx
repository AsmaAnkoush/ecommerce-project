import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchProducts } from '../../api/productApi'
import { useLanguage } from '../../context/LanguageContext'
import { useUI } from '../../context/UIContext'
import ProductCard from '../product/ProductCard'

export default function SearchOverlay() {
  const { searchOpen, closeSearch } = useUI()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Focus input when overlay opens
  useEffect(() => {
    if (searchOpen) {
      setQuery('')
      setResults([])
      setSearched(false)
      setTimeout(() => inputRef.current?.focus(), 150)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [searchOpen])

  // ESC to close
  useEffect(() => {
    if (!searchOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') closeSearch() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [searchOpen, closeSearch])

  // Debounced search
  const doSearch = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    try {
      setLoading(true)
      const res = await searchProducts(keyword.trim())
      const list = res.data?.data?.content ?? res.data?.data ?? []
      setResults(Array.isArray(list) ? list : [])
      setSearched(true)
    } catch {
      setResults([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  if (!searchOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#FDF6F7]/97 backdrop-blur-sm animate-fade-in"
        onClick={closeSearch}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">

        {/* Top bar: close button */}
        <div className="flex items-center justify-end pt-5 pb-4">
          <button
            onClick={closeSearch}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#F0E0E3] transition-all duration-200"
            aria-label="Close search"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="mb-8">
          <div className="relative">
            <svg
              className="absolute start-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C4A0A6] pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              placeholder={t('search.placeholder')}
              className="w-full ps-14 pe-5 py-4 sm:py-5 bg-white rounded-2xl border border-[#F0D5D8] text-[#3D1A1E] text-base sm:text-lg placeholder-[#C4A0A6] focus:outline-none focus:border-[#DFA3AD] focus:ring-2 focus:ring-[#DFA3AD]/20 transition-all duration-200"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px' }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); setSearched(false); inputRef.current?.focus() }}
                className="absolute end-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-[#C4A0A6] hover:text-[#6B1F2A] hover:bg-[#F9EEF0] transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto pb-8">
          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#DFA3AD] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#9B7B80] text-sm tracking-wide">{t('search.noResults')}</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <h3
                className="text-lg sm:text-xl font-medium text-[#6B1F2B] mb-6 tracking-[0.04em]"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {t('search.results')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
                {results.map((p, i) => (
                  <div
                    key={p.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                    onClick={closeSearch}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !searched && (
            <div className="text-center py-16">
              <p className="text-[#C4A0A6] text-sm tracking-wide">{t('search.hint')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
