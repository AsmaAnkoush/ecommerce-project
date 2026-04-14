import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteProduct, toggleProductVisibility } from '../../api/productApi'
import { getAdminProducts } from '../../api/adminApi'
import Spinner from '../../components/ui/Spinner'
import PageHeader from '../../components/layout/PageHeader'
import { useFormatPrice } from '../../utils/formatPrice'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'

/* ─── Stock threshold ──────────────────────────────────────────────────── */
const LOW_STOCK_THRESHOLD = 5

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function stockStatus(qty) {
  if (qty === 0)                          return 'out'
  if (qty <= LOW_STOCK_THRESHOLD)         return 'low'
  return 'ok'
}

const STATUS_STYLES = {
  out: { dot: 'bg-red-500',     text: 'text-red-700',    label: 'نفذ' },
  low: { dot: 'bg-amber-400',   text: 'text-amber-700',  label: 'منخفض' },
  ok:  { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'متوفر' },
}

/** Returns { outCount, lowCount, okCount } across a product's variants (or its flat stock). */
function productVariantCounts(p) {
  if (p.variants?.length > 0) {
    return p.variants.reduce(
      (acc, v) => {
        const s = stockStatus(v.stockQuantity)
        acc[s === 'out' ? 'outCount' : s === 'low' ? 'lowCount' : 'okCount']++
        return acc
      },
      { outCount: 0, lowCount: 0, okCount: 0 }
    )
  }
  const s = stockStatus(p.stockQuantity)
  return {
    outCount: s === 'out' ? 1 : 0,
    lowCount: s === 'low' ? 1 : 0,
    okCount:  s === 'ok'  ? 1 : 0,
  }
}

/** Groups variant array by color. */
function groupByColor(variants) {
  return variants.reduce((acc, v) => {
    const key = v.color || '—'
    if (!acc[key]) acc[key] = []
    acc[key].push(v)
    return acc
  }, {})
}

/* ─── Color lookup ────────────────────────────────────────────────────── */
const COLOR_HEX = {
  black: '#000000', white: '#FFFFFF', 'navy blue': '#001F5B', beige: '#F5F0E8',
  brown: '#8B4513', red: '#CC0000', green: '#2D6A4F', gray: '#6B6B6B',
  camel: '#C19A6B', burgundy: '#800020', olive: '#6B7C44', coral: '#FF6B6B',
  pink: '#FFB6C1', cream: '#FFFDD0', navy: '#001F5B', blue: '#1A56C4',
  yellow: '#F0C040', orange: '#D4600A', purple: '#6B2FA0',
}
function getColorHex(name) {
  if (!name) return null
  const hex = COLOR_HEX[name.toLowerCase()]
  if (hex) return hex
  if (/^#[0-9a-f]{3,8}$/i.test(name)) return name
  return null
}

/* ─── Sub-components ───────────────────────────────────────────────────── */

const SIZE_ORDER = ['XS','S','M','L','XL','XXL','XXXL']
const sortVariants = arr => arr.slice().sort((a, b) => {
  const ai = SIZE_ORDER.indexOf(a.size ?? '')
  const bi = SIZE_ORDER.indexOf(b.size ?? '')
  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
})

/** Compact variant breakdown — table layout, minimal colors. */
function VariantBreakdown({ product }) {
  const { t } = useLanguage()
  if (!product.variants?.length) return null
  const byColor = groupByColor(product.variants)

  return (
    <div className="px-5 pb-4 pt-1" style={{ background: '#FDF9FA' }}>
      {Object.entries(byColor).map(([color, variants]) => {
        const hex = getColorHex(color)
        return (
        <div key={color} className="mt-3 first:mt-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            {hex && (
              <span className="w-4 h-4 rounded-full shrink-0 border border-gray-200"
                    style={{ backgroundColor: hex }} />
            )}
            <span className="text-[11px] font-medium" style={{ color: '#6B4E53' }}>{color}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sortVariants(variants).map(v => {
              const s = stockStatus(v.stockQuantity)
              const isOut = s === 'out'
              const isLow = s === 'low'
              const baseClass = 'inline-flex items-center gap-1.5 text-[11px] tabular-nums px-2 py-1 rounded-md transition-all'
              const variantClass =
                isOut ? 'bg-red-50 border-red-200 text-red-700 animate-low-stock-pulse' :
                isLow ? 'bg-amber-50 border-amber-200 text-amber-700 animate-low-stock-pulse' :
                        'bg-white border-[#F0DDE0] text-[#6B4E53]'
              return (
                <span key={`${v.color}-${v.size}`}
                  className={`${baseClass} ${variantClass}`}
                  style={{ borderWidth: 1, borderStyle: 'solid' }}
                  title={`${v.size}: ${v.stockQuantity}`}>
                  <span className="font-semibold">{v.size || '—'}</span>
                  <span className="opacity-60">·</span>
                  <span className="font-bold">{v.stockQuantity}</span>
                  {isOut && (
                    <span className="inline-flex items-center gap-1 ps-1.5 ms-0.5 border-s border-red-200 text-[10px] font-semibold">
                      <span aria-hidden="true">❌</span>
                      {t('admin.variantOutOfStock')}
                    </span>
                  )}
                  {isLow && (
                    <span className="inline-flex items-center gap-1 ps-1.5 ms-0.5 border-s border-amber-200 text-[10px] font-semibold">
                      <span aria-hidden="true">⚠️</span>
                      {t('admin.variantLowStock')}
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
        )
      })}
    </div>
  )
}

/* ─── Main page ────────────────────────────────────────────────────────── */
export default function AdminProducts() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const stockAlertShownRef = useRef(false)
  const formatPrice = useFormatPrice()
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [deleting, setDeleting]   = useState(null)
  const [toggling, setToggling]   = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [search, setSearch] = useState('')
  const [confirmTarget, setConfirmTarget] = useState(null)

  const fetchProducts = async (p = 0) => {
    setLoading(true)
    try {
      const res = await getAdminProducts({ page: p, size: 15 })
      const content = res.data.data?.content ?? []
      setProducts(content)
      setTotalPages(res.data.data?.totalPages ?? 0)
      setPage(p)
      // Auto-expand products with at least one out-of-stock variant
      const autoExpand = content.find(
        prod => prod.variants?.some(v => v.stockQuantity === 0)
      )
      if (autoExpand) setExpandedId(autoExpand.id)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async () => {
    if (!confirmTarget) return
    const id = confirmTarget.id
    setDeleting(id)
    try {
      await deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setConfirmTarget(null)
      toast(t('admin.deletedSuccess'))
    } catch (err) {
      console.error('Delete failed:', err)
      const msg = err?.response?.data?.message || t('admin.failedDelete')
      toast(msg, 'error')
    } finally { setDeleting(null) }
  }

  const handleToggleVisibility = async (id) => {
    const target = products.find(p => p.id === id)
    if (!target) return
    const previous = !!target.active
    const optimistic = !previous
    // Optimistic: flip the row immediately
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: optimistic } : p))
    setToggling(id)
    try {
      const res = await toggleProductVisibility(id)
      const next = res?.data?.data?.active ?? optimistic
      setProducts(prev => prev.map(p => p.id === id ? { ...p, active: next } : p))
      toast(next ? t('admin.productNowVisible') : t('admin.productNowHidden'))
    } catch (err) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, active: previous } : p))
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally {
      setToggling(null)
    }
  }

  const toggleExpand = (id) =>
    setExpandedId(prev => (prev === id ? null : id))

  /* ── Compute alert counts across ALL active products ── */
  const activeProducts = products.filter(p => p.active)

  // Products that have at least one out-of-stock variant (or flat stock = 0)
  const productsWithOutOfStock = activeProducts.filter(p => {
    if (p.variants?.length > 0) return p.variants.some(v => v.stockQuantity === 0)
    return p.stockQuantity === 0
  })

  // Products that have at least one low-stock variant (and NO out-of-stock)
  const productsWithLowStock = activeProducts.filter(p => {
    const { outCount, lowCount } = productVariantCounts(p)
    return outCount === 0 && lowCount > 0
  })

  // Total out-of-stock variant count (for badge)
  const totalOutVariants = activeProducts.reduce((sum, p) => {
    if (p.variants?.length > 0) return sum + p.variants.filter(v => v.stockQuantity === 0).length
    return sum + (p.stockQuantity === 0 ? 1 : 0)
  }, 0)

  const totalLowVariants = activeProducts.reduce((sum, p) => {
    if (p.variants?.length > 0)
      return sum + p.variants.filter(v => v.stockQuantity > 0 && v.stockQuantity <= LOW_STOCK_THRESHOLD).length
    const s = stockStatus(p.stockQuantity)
    return sum + (s === 'low' ? 1 : 0)
  }, 0)

  useEffect(() => {
    if (loading || stockAlertShownRef.current) return
    if (totalOutVariants > 0 || totalLowVariants > 0) {
      toast(t('admin.stockAlertToast'), 'error')
      stockAlertShownRef.current = true
    }
  }, [loading, totalOutVariants, totalLowVariants, toast, t])

  /* ── Client-side search filter ── */
  const filtered = products.filter(p =>
    !search.trim() ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.categoryName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader />
      <div className="p-5 lg:p-7 pt-0">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#C4A0A6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${t('admin.search')}…`}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border outline-none transition-colors"
            style={{ borderColor: '#E8D8DB', background: '#fff', color: '#3D1A1E' }}
            onFocus={e => e.target.style.borderColor = '#6B1F2A'}
            onBlur={e => e.target.style.borderColor = '#E8D8DB'}
          />
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all shrink-0"
          style={{ background: 'linear-gradient(135deg,#6B1F2A,#8B2535)', boxShadow: '0 2px 8px rgba(107,31,42,0.35)' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,31,42,0.45)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(107,31,42,0.35)'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('admin.addProduct')}
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
      ) : (
        <div className="admin-table-wrap"><div className="admin-table-scroll">
          <table className="w-full text-sm min-w-[960px]" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ background: '#FDF9FA', color: '#9B7B80' }}>
                <th className="text-start px-4 py-3 w-12">#</th>
                <th className="text-start px-4 py-3 min-w-[220px]">{t('admin.product') || 'Product'}</th>
                <th className="text-start px-4 py-3 min-w-[140px]">{t('admin.price') || 'Price'}</th>
                <th className="text-start px-4 py-3 min-w-[160px]">{t('admin.status') || 'Status'}</th>
                <th className="text-start px-4 py-3 min-w-[220px]">{t('admin.variants') || 'Variants'}</th>
                <th className="text-start px-4 py-3 min-w-[140px]">{t('admin.added') || 'Added'}</th>
                <th className="text-end px-4 py-3 min-w-[180px]">{t('admin.actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#F5EDEF' }}>
              {filtered.map((p, idx) => {
                const { outCount, lowCount } = productVariantCounts(p)
                const hasVariants = p.variants?.length > 0
                const isExpanded = expandedId === p.id
                const stk = stockStatus(hasVariants ? (outCount > 0 ? 0 : lowCount > 0 ? 3 : 10) : p.stockQuantity)
                const isLowStock = stk === 'low'
                const isOutOfStock = stk === 'out'
                const uniqueColors = hasVariants ? [...new Set(p.variants.map(v => v.color).filter(Boolean))] : []
                const uniqueSizes  = hasVariants ? [...new Set(p.variants.map(v => v.size).filter(Boolean))] : []

                return (
                  <Fragment key={p.id}>
                    <tr className="hover:bg-[#FDFBFC] transition-colors align-middle">
                      {/* Index */}
                      <td className="px-4 py-3">
                        <span
                          className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-semibold tabular-nums"
                          style={{ background: '#FDF0F2', border: '1px solid #F0DDE0', color: '#9B6670' }}
                          aria-label={`#${idx + 1}`}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: '#FDF6F7', border: '1px solid #F0DDE0' }}>
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ color: '#DFA3AD' }}>
                                  {(p.name || '?').charAt(0)}
                                </div>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate max-w-[220px]" style={{ color: '#3D1A1E' }}>{p.name}</p>
                            {p.categoryName && (
                              <p className="text-[11px] truncate" style={{ color: '#9B7B80' }}>{p.categoryName}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.discountPrice ? (
                          <div className="flex items-center gap-2 text-[12px]">
                            <span className="font-semibold" style={{ color: '#6B1F2A' }}>{formatPrice(p.discountPrice)}</span>
                            <span className="line-through" style={{ color: '#B08A90' }}>{formatPrice(p.price)}</span>
                          </div>
                        ) : (
                          <span className="text-[12px] font-semibold" style={{ color: '#3D1A1E' }}>{formatPrice(p.price)}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-red-700 animate-low-stock-pulse">
                              <span aria-hidden="true">❌</span>
                              {t('admin.outOfStockBadge')}
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 animate-low-stock-pulse">
                              <span aria-hidden="true">⚠</span>
                              {t('admin.lowStockBadge')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] tabular-nums px-2.5 py-1 rounded-full border border-[#F0DDE0] text-[#6B4E53]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {t('admin.inStockCount').replace('{count}', p.stockQuantity)}
                            </span>
                          )}
                          {!p.active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#9B7B80', background: '#F5EDEF' }}>
                              {t('admin.hide')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Variants summary */}
                      <td className="px-4 py-3">
                        {hasVariants ? (
                          <div className="flex items-center gap-3 flex-wrap">
                            {uniqueColors.length > 0 && (
                              <span className="inline-flex items-center gap-1">
                                {uniqueColors.slice(0, 5).map(c => {
                                  const hex = getColorHex(c)
                                  return hex ? (
                                    <span key={c} title={c} className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: hex, borderColor: '#E5DDE0' }} />
                                  ) : (
                                    <span key={c} className="text-[10px]" style={{ color: '#9B7B80' }}>{c}</span>
                                  )
                                })}
                                {uniqueColors.length > 5 && (
                                  <span className="text-[10px]" style={{ color: '#9B7B80' }}>+{uniqueColors.length - 5}</span>
                                )}
                              </span>
                            )}
                            {uniqueSizes.length > 0 && (
                              <span className="text-[11px] tabular-nums" style={{ color: '#6B4E53' }}>
                                {uniqueSizes.slice(0, 5).join(' · ')}
                                {uniqueSizes.length > 5 ? ` +${uniqueSizes.length - 5}` : ''}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleExpand(p.id)}
                              className="text-[10px] font-medium px-2 py-1 rounded-lg transition-colors"
                              style={isExpanded ? { background: '#6B1F2A', color: '#fff' } : { background: '#F5EDEF', color: '#9B6670' }}
                            >
                              {isExpanded ? t('admin.hide') : t('admin.view')}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px]" style={{ color: '#C4A0A6' }}>—</span>
                        )}
                      </td>

                      {/* Added — day · date · time, sorted newest-first by the API */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CreatedAtCell value={p.createdAt} />
                      </td>

                      {/* Actions — icon-only with tooltips */}
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit */}
                          <Link to={`/admin/products/${p.id}/edit`} title={t('admin.edit')} aria-label={t('admin.edit')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                            style={{ background: '#EFF6FF', color: '#3B82F6' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
                            onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                            </svg>
                          </Link>
                          {/* Visibility toggle — same palette as categories: green when visible, gray when hidden */}
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(p.id)}
                            disabled={toggling === p.id}
                            title={p.active ? t('admin.categoryVisible') : t('admin.categoryHidden')}
                            aria-label={p.active ? t('admin.categoryVisible') : t('admin.categoryHidden')}
                            aria-pressed={!!p.active}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                            style={p.active
                              ? { background: '#ECFDF5', color: '#059669' }
                              : { background: '#F3F4F6', color: '#9CA3AF' }
                            }
                            onMouseEnter={e => e.currentTarget.style.background = p.active ? '#D1FAE5' : '#E5E7EB'}
                            onMouseLeave={e => e.currentTarget.style.background = p.active ? '#ECFDF5' : '#F3F4F6'}>
                            {toggling === p.id ? (
                              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : p.active ? (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              </svg>
                            )}
                          </button>
                          {/* Preview — opens public product page in a new tab (external-link icon, distinct from the eye toggle) */}
                          <button
                            type="button"
                            onClick={() => window.open(`/products/${p.id}`, '_blank', 'noopener,noreferrer')}
                            title={t('admin.viewProductPage')}
                            aria-label={t('admin.viewProductPage')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                            style={{ background: '#F5F3FF', color: '#7C3AED' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#EDE9FE'}
                            onMouseLeave={e => e.currentTarget.style.background = '#F5F3FF'}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-9 9M19 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h6" />
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setConfirmTarget(p)}
                            disabled={deleting === p.id}
                            title={t('admin.delete')}
                            aria-label={t('admin.delete')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-40 disabled:hover:scale-100"
                            style={{ background: '#FEF2F2', color: '#EF4444' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                            onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                            {deleting === p.id ? (
                              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && hasVariants && (
                      <tr>
                        <td colSpan={7} style={{ background: '#FDF9FA', borderTop: '1px solid #F5EDEF' }}>
                          <VariantBreakdown product={p} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#FDF0F2', border: '1px solid #EDD8DC' }}>
                        <svg className="w-7 h-7" style={{ color: '#DFA3AD' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium" style={{ color: '#9B7B80' }}>{t('admin.noProductsFound')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 p-4" style={{ borderTop: '1px solid #F5EDEF' }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => fetchProducts(i)}
                  className="w-8 h-8 text-sm rounded-xl font-medium transition-all"
                  style={i === page
                    ? { background: '#6B1F2A', color: '#fff', boxShadow: '0 2px 8px rgba(107,31,42,0.3)' }
                    : { border: '1px solid #F0E8EA', color: '#9B6670' }
                  }
                  onMouseEnter={e => { if (i !== page) e.currentTarget.style.background = '#FDF0F2' }}
                  onMouseLeave={e => { if (i !== page) e.currentTarget.style.background = 'transparent' }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        itemName={confirmTarget?.name}
        loading={deleting === confirmTarget?.id}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
      </div>
    </div>
  )
}

/**
 * Compact "created at" cell — three stacked lines: weekday, ISO date, time.
 * Uses Intl so the weekday/AM-PM format adapts to the browser locale; the
 * date stays as ISO `YYYY-MM-DD` because admins want it sortable at a glance.
 */
function CreatedAtCell({ value }) {
  if (!value) return <span className="text-[11px]" style={{ color: '#C4A0A6' }}>—</span>
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return <span className="text-[11px]" style={{ color: '#C4A0A6' }}>—</span>
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' })
  const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return (
    <div title={d.toLocaleString()}>
      <div className="text-xs text-gray-500">{weekday}</div>
      <div className="text-sm font-medium tabular-nums" style={{ color: '#3D1A1E' }}>{isoDate}</div>
      <div className="text-xs text-gray-400 tabular-nums">{time}</div>
    </div>
  )
}
