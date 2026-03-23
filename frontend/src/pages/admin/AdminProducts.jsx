import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteProduct, toggleProductVisibility } from '../../api/productApi'
import { getAdminProducts } from '../../api/adminApi'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

/* ─── Stock threshold ──────────────────────────────────────────────────── */
const LOW_STOCK_THRESHOLD = 5

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function stockStatus(qty) {
  if (qty === 0)                          return 'out'
  if (qty <= LOW_STOCK_THRESHOLD)         return 'low'
  return 'ok'
}

const STATUS_STYLES = {
  out: { chip: 'bg-red-50 border-red-200 text-red-700',   dot: 'bg-red-500',   label: 'نفذ',     icon: '⛔' },
  low: { chip: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-400', label: 'منخفض',  icon: '⚠️' },
  ok:  { chip: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500', label: 'متوفر', icon: '✅' },
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

/* ─── Sub-components ───────────────────────────────────────────────────── */

/** Small colored pill showing stock for one variant size. */
function VariantChip({ variant }) {
  const s = stockStatus(variant.stockQuantity)
  const st = STATUS_STYLES[s]
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${st.chip}`}>
      <span className="font-semibold">{variant.size || '—'}</span>
      <span className="font-bold">{variant.stockQuantity}</span>
      <span className="text-[11px]">{st.icon}</span>
    </div>
  )
}

/** Expanded variant breakdown rendered as a full-width sub-row. */
function VariantBreakdown({ product }) {
  if (!product.variants?.length) return null

  const byColor = groupByColor(product.variants)

  return (
    <div className="px-6 pt-2 pb-5 bg-gray-50/70 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          تفاصيل المخزون — {product.variants.length} متغيّر
        </p>
        {/* Legend */}
        <div className="flex items-center gap-4">
          {(['out', 'low', 'ok']).map(s => (
            <span key={s} className="flex items-center gap-1 text-[11px] text-gray-500">
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_STYLES[s].dot}`} />
              {STATUS_STYLES[s].label}
            </span>
          ))}
        </div>
      </div>

      {/* Color groups */}
      <div className="space-y-3">
        {Object.entries(byColor).map(([color, variants]) => {
          const worst = variants.some(v => v.stockQuantity === 0)
            ? 'out'
            : variants.some(v => v.stockQuantity <= LOW_STOCK_THRESHOLD)
            ? 'low'
            : 'ok'
          return (
            <div key={color} className="flex items-start gap-3">
              {/* Color label */}
              <div className="flex items-center gap-1.5 min-w-[80px] pt-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_STYLES[worst].dot}`} />
                <span className="text-xs font-medium text-gray-700 truncate">{color}</span>
              </div>
              {/* Size chips */}
              <div className="flex flex-wrap gap-1.5">
                {variants
                  .slice()
                  .sort((a, b) => {
                    const order = ['XS','S','M','L','XL','XXL','XXXL']
                    return (order.indexOf(a.size) ?? 99) - (order.indexOf(b.size) ?? 99)
                  })
                  .map(v => (
                    <VariantChip key={`${v.color}-${v.size}`} variant={v} />
                  ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Main page ────────────────────────────────────────────────────────── */
export default function AdminProducts() {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [deleting, setDeleting]   = useState(null)
  const [toggling, setToggling]   = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const fetchProducts = async (p = 0) => {
    setLoading(true)
    try {
      const res = await getAdminProducts({ page: p, size: 15 })
      setProducts(res.data.data?.content ?? [])
      setTotalPages(res.data.data?.totalPages ?? 0)
      setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async (id) => {
    if (!confirm('هل تريد حذف هذا المنتج؟')) return
    setDeleting(id)
    try {
      await deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert('فشل حذف المنتج. حاول مرة أخرى.')
      console.error('Delete failed:', err)
    } finally { setDeleting(null) }
  }

  const handleToggleVisibility = async (id) => {
    setToggling(id)
    try { await toggleProductVisibility(id); await fetchProducts(page) }
    finally { setToggling(null) }
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

  return (
    <div className="p-8">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المنتجات</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            حد المخزون المنخفض: <span className="font-semibold text-gray-600">{LOW_STOCK_THRESHOLD} قطع أو أقل</span>
          </p>
        </div>
        <Link to="/admin/products/new">
          <Button>+ إضافة منتج</Button>
        </Link>
      </div>

      {/* ── Alert banners (variant-aware) ── */}
      {!loading && (productsWithOutOfStock.length > 0 || productsWithLowStock.length > 0) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {productsWithOutOfStock.length > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5 flex-1 min-w-[260px]">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-red-800">
                  {totalOutVariants} متغيّر نفذ من المخزون
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  في {productsWithOutOfStock.length} منتج — اضغط على ↓ لرؤية التفاصيل
                </p>
              </div>
            </div>
          )}
          {productsWithLowStock.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex-1 min-w-[260px]">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-amber-800">
                  {totalLowVariants} متغيّر مخزونه منخفض
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  في {productsWithLowStock.length} منتج — أقل من {LOW_STOCK_THRESHOLD} قطع
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FDF6F7] border-b border-[#F0D5D8]">
              <tr>
                <th className="text-start px-5 py-3 font-semibold text-gray-600 w-8" />
                <th className="text-start px-5 py-3 font-semibold text-gray-600">المنتج</th>
                <th className="text-start px-5 py-3 font-semibold text-gray-600">الفئة</th>
                <th className="text-start px-5 py-3 font-semibold text-gray-600">السعر</th>
                <th className="text-start px-5 py-3 font-semibold text-gray-600">المخزون</th>
                <th className="text-start px-5 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const { outCount, lowCount } = productVariantCounts(p)
                const hasVariants = p.variants?.length > 0
                const isExpanded  = expandedId === p.id
                const rowAlert    = outCount > 0 ? 'out' : lowCount > 0 ? 'low' : null

                // Row background
                const rowBg = rowAlert === 'out'
                  ? 'bg-red-50/40 hover:bg-red-50/70'
                  : rowAlert === 'low'
                  ? 'bg-amber-50/40 hover:bg-amber-50/70'
                  : 'hover:bg-gray-50'

                return [
                  /* ── Main data row ── */
                  <tr key={p.id} className={`transition-colors border-b border-gray-100 ${rowBg}`}>

                    {/* Expand toggle */}
                    <td className="ps-3 pe-0 py-3 w-8">
                      {hasVariants && (
                        <button
                          onClick={() => toggleExpand(p.id)}
                          title={isExpanded ? 'إخفاء التفاصيل' : 'عرض تفاصيل المخزون'}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            isExpanded
                              ? 'bg-[#6B1F2A] text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          <svg
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </td>

                    {/* Product info */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                          {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3 text-gray-600">{p.categoryName || '—'}</td>

                    {/* Price */}
                    <td className="px-5 py-3">
                      {p.discountPrice ? (
                        <div>
                          <span className="font-semibold text-red-600">₪{Number(p.discountPrice).toFixed(0)}</span>
                          <span className="text-xs text-gray-400 line-through ml-1">₪{Number(p.price).toFixed(0)}</span>
                        </div>
                      ) : (
                        <span className="font-medium">₪{Number(p.price).toFixed(0)}</span>
                      )}
                    </td>

                    {/* Stock column — variant-aware */}
                    <td className="px-5 py-3">
                      {hasVariants ? (
                        <div className="space-y-1">
                          {/* Total */}
                          <span className="text-xs text-gray-400">{p.stockQuantity} إجمالي</span>
                          {/* Variant alerts */}
                          <div className="flex flex-wrap gap-1">
                            {outCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                ⛔ {outCount} نفذ
                              </span>
                            )}
                            {lowCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                ⚠️ {lowCount} منخفض
                              </span>
                            )}
                            {outCount === 0 && lowCount === 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                ✅ كل المتغيّرات متوفرة
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* No variants — flat stock */
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold ${
                            stockStatus(p.stockQuantity) === 'out' ? 'text-red-600'
                            : stockStatus(p.stockQuantity) === 'low' ? 'text-amber-600'
                            : 'text-green-600'
                          }`}>
                            {p.stockQuantity}
                          </span>
                          {stockStatus(p.stockQuantity) === 'out' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">⛔ نفذ</span>
                          )}
                          {stockStatus(p.stockQuantity) === 'low' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">⚠️ منخفض</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Visibility status */}
                    <td className="px-5 py-3">
                      <Badge variant={p.active ? 'success' : 'danger'}>{p.active ? 'ظاهر' : 'مخفي'}</Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleVisibility(p.id)}
                          disabled={toggling === p.id}
                          title={p.active ? 'إخفاء المنتج' : 'إظهار المنتج'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
                            p.active
                              ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border border-yellow-200'
                              : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                          }`}
                        >
                          {toggling === p.id ? (
                            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : p.active ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <Link to={`/admin/products/${p.id}/edit`}>
                          <Button variant="secondary" size="sm">Edit</Button>
                        </Link>
                        <Button variant="danger" size="sm" loading={deleting === p.id} onClick={() => handleDelete(p.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>,

                  /* ── Expanded variant breakdown row ── */
                  isExpanded && hasVariants && (
                    <tr key={`${p.id}-expanded`}>
                      <td colSpan={7} className="p-0">
                        <VariantBreakdown product={p} />
                      </td>
                    </tr>
                  ),
                ]
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => fetchProducts(i)}
                  className={`w-8 h-8 text-sm rounded-lg ${i === page ? 'bg-black text-white' : 'border hover:bg-gray-50'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
