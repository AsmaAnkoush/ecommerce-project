import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormatPrice } from '../../utils/formatPrice'
import { setProductDiscount } from '../../api/productApi'
import { getAdminProducts } from '../../api/adminApi'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/layout/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'

function DiscountBadge({ original, discounted }) {
  if (!discounted || discounted >= original) return null
  const pct = Math.round((1 - discounted / original) * 100)
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 tabular-nums">
      -{pct}%
    </span>
  )
}

/** Backend expects List<ColorImagesRequest> — i.e. `[{ color, imageUrls: [...] }]`.
 *  The API response returns it as a map `{ color: [{url}] }` or plain `{ color: [url] }`,
 *  so normalize both shapes (and tolerate already-correct arrays). */
function normalizeColorImages(ci) {
  if (!ci) return []
  if (Array.isArray(ci)) {
    return ci
      .filter(entry => entry && entry.color)
      .map(entry => ({
        color: entry.color,
        imageUrls: Array.isArray(entry.imageUrls)
          ? entry.imageUrls.map(x => (typeof x === 'string' ? x : x?.url)).filter(Boolean)
          : [],
      }))
  }
  if (typeof ci === 'object') {
    return Object.entries(ci).map(([color, entries]) => {
      const list = Array.isArray(entries) ? entries : []
      const primary = list.find(x => x && x.isPrimary)?.url || null
      return {
        color,
        imageUrls: list.map(x => (typeof x === 'string' ? x : x?.url)).filter(Boolean),
        primaryImageUrl: primary,
      }
    })
  }
  return []
}

/** Build a PUT payload that preserves every field we received from the API.
 *  Missing fields can reset to nulls on the server side, so we pass everything through. */
function buildUpdatePayload(product, patch) {
  return {
    name:             product.name,
    description:      product.description || '',
    price:            product.price,
    discountPrice:    product.discountPrice ?? null,
    discountType:     product.discountType ?? null,
    discountValue:    product.discountValue ?? null,
    stockQuantity:    product.stockQuantity,
    imageUrl:         product.imageUrl || '',
    additionalImages: product.additionalImages || product.imageUrls || [],
    colorImages:      normalizeColorImages(product.colorImages),
    brand:            product.brand || '',
    size:             product.size || '',
    color:            product.color || '',
    material:         product.material || '',
    categoryId:       product.categoryId,
    isBestSeller:     product.isBestSeller ?? false,
    isNew:            product.isNew ?? false,
    season:           product.season || null,
    variants:         product.variants || [],
    ...patch,
  }
}

export default function AdminOffers() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const formatPrice = useFormatPrice()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState('active') // 'active' | 'all'
  const [editingId, setEditingId] = useState(null)
  const [discountInput, setDiscountInput] = useState('')
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')
  const [confirmTarget, setConfirmTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    setLoadError('')
    try {
      // Backend caps page size at 100 (PageRequestValidator). Use the max
      // allowed so we still get the broadest catalogue in one call.
      const res = await getAdminProducts({ size: 100 })
      const payload = res.data?.data
      const list = Array.isArray(payload?.content) ? payload.content
                 : Array.isArray(payload)         ? payload
                 : []
      setProducts(list)
    } catch (err) {
      console.error('Failed to load admin offers:', err)
      setLoadError(err?.response?.data?.message || t('admin.failedLoad') || 'Failed to load offers')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const hasOffer = (p) => p.discountPrice != null && p.discountPrice < p.price
  const onSale   = products.filter(hasOffer)
  const displayed = tab === 'active' ? onSale : products

  const startEdit = (product) => {
    setEditingId(product.id)
    setDiscountInput(product.discountPrice ? String(product.discountPrice) : '')
    setError('')
  }

  const cancelEdit = () => { setEditingId(null); setDiscountInput(''); setError('') }

  const handleSave = async (product) => {
    const val = parseFloat(discountInput)
    if (isNaN(val) || val <= 0) { setError(t('admin.enterValidPrice')); return }
    if (val >= product.price)   { setError(t('admin.discountMustBeLess')); return }
    setSaving(product.id)
    try {
      const res = await setProductDiscount(product.id, val)
      const updated = res?.data?.data
      // Optimistic in-place update so the row reflects the new price without a full reload
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...updated } : p))
      cancelEdit()
      toast(t('admin.offerApplied') || t('admin.updatedSuccess'))
    } catch (err) {
      console.error('Save discount failed:', err)
      setError(err?.response?.data?.message || t('admin.failedSave'))
    } finally {
      setSaving(null)
    }
  }

  const handleRemove = async () => {
    if (!confirmTarget) return
    const product = confirmTarget
    setSaving(product.id)
    try {
      const res = await setProductDiscount(product.id, null)
      const updated = res?.data?.data
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...updated, discountPrice: null } : p))
      setConfirmTarget(null)
      toast(t('admin.offerRemoved') || t('admin.updatedSuccess'))
    } catch (err) {
      console.error('Remove discount failed:', err)
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('admin.offersDiscounts')}
        subtitle={t('admin.headerOffersSub')}
        icon="🏷️"
        color="#7B1E2B"
      />
      <div className="p-5 lg:p-7 pt-0">
      {loadError && (
        <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div className="flex-1"><p className="font-medium">{loadError}</p></div>
          <button type="button" onClick={load} className="text-xs font-medium text-red-600 hover:text-red-800 underline underline-offset-2 shrink-0">
            {t('common.retry') || 'Retry'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: '#FDF0F2' }}>
        {[
          { key: 'active', label: `${t('admin.activeOffers')} (${onSale.length})` },
          { key: 'all',    label: `${t('admin.allProductsTab')} (${products.length})` },
        ].map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
            style={tab === tb.key
              ? { background: '#fff', color: '#3D1A1E', boxShadow: '0 1px 4px rgba(107,31,42,0.08)' }
              : { background: 'transparent', color: '#9B7B80' }
            }
          >
            {tb.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="admin-table-wrap"><div className="admin-table-scroll">
          <table className="w-full text-sm min-w-[960px]" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ background: '#FDF9FA', color: '#9B7B80' }}>
                <th className="text-start px-4 py-3 w-12">#</th>
                <th className="text-start px-4 py-3 min-w-[240px]">{t('admin.product') || 'Product'}</th>
                <th className="text-start px-4 py-3 min-w-[120px]">{t('admin.originalPrice')}</th>
                <th className="text-start px-4 py-3 min-w-[180px]">{t('admin.discountPrice')}</th>
                <th className="text-start px-4 py-3 min-w-[140px]">{t('admin.savingAmount')}</th>
                <th className="text-start px-4 py-3 min-w-[120px]">{t('admin.status') || 'Status'}</th>
                <th className="text-end px-4 py-3 min-w-[160px]">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#F5EDEF' }}>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#FDF0F2', border: '1px solid #EDD8DC' }}>
                        <svg className="w-7 h-7" style={{ color: '#DFA3AD' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium" style={{ color: '#9B7B80' }}>
                        {tab === 'active' ? t('admin.noActiveOffers') : t('admin.noProductsFound')}
                      </p>
                      {tab === 'active' && <p className="text-xs" style={{ color: '#C4A0A6' }}>{t('admin.switchToAll')}</p>}
                    </div>
                  </td>
                </tr>
              ) : displayed.map((product, idx) => {
                const hasDiscount = hasOffer(product)
                const isEditing = editingId === product.id
                const saveInProgress = saving === product.id
                return (
                  <tr key={product.id} className="hover:bg-[#FDFBFC] transition-colors align-middle">
                    {/* # */}
                    <td className="px-4 py-3">
                      <span
                        className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-semibold tabular-nums"
                        style={{ background: '#FDF0F2', border: '1px solid #F0DDE0', color: '#9B6670' }}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: '#FDF6F7', border: '1px solid #F0DDE0' }}>
                          {product.imageUrl
                            ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-1" />
                            : <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ color: '#DFA3AD' }}>
                                {(product.name || '?').charAt(0)}
                              </div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[220px]" style={{ color: '#3D1A1E' }}>{product.name}</p>
                          {product.categoryName && (
                            <p className="text-[11px] truncate" style={{ color: '#9B7B80' }}>{product.categoryName}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Original price */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px]" style={{ color: '#6B4E53' }}>
                      {formatPrice(product.price)}
                    </td>

                    {/* Discount price (+ inline editor) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={discountInput}
                              onChange={e => { setDiscountInput(e.target.value); setError('') }}
                              step="0.01"
                              min="0.01"
                              max={product.price - 0.01}
                              placeholder="0.00"
                              className="w-28 px-2 py-1 text-sm border rounded-lg focus:outline-none transition-colors"
                              style={{ borderColor: '#E8D8DB', color: '#3D1A1E' }}
                              onFocus={e => e.target.style.borderColor = '#6B1F2A'}
                              onBlur={e => e.target.style.borderColor = '#E8D8DB'}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSave(product)}
                              disabled={saveInProgress}
                              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              style={{ background: '#6B1F2A', color: '#fff' }}
                            >
                              {saveInProgress ? '…' : t('admin.save')}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                              style={{ background: '#F5EDEF', color: '#9B6670' }}
                            >
                              {t('admin.cancel')}
                            </button>
                          </div>
                          {error && <p className="text-[10px] text-red-500">{error}</p>}
                        </div>
                      ) : hasDiscount ? (
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="font-semibold" style={{ color: '#6B1F2A' }}>{formatPrice(product.discountPrice)}</span>
                          <DiscountBadge original={product.price} discounted={product.discountPrice} />
                        </div>
                      ) : (
                        <span className="text-[11px]" style={{ color: '#C4A0A6' }}>—</span>
                      )}
                    </td>

                    {/* Savings */}
                    <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                      {hasDiscount ? (
                        <span className="font-medium text-emerald-600 nums-normal">
                          {formatPrice(Number(product.price) - Number(product.discountPrice))}
                        </span>
                      ) : (
                        <span style={{ color: '#C4A0A6' }}>—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {hasDiscount ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {t('admin.activeOffer')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border border-[#F0DDE0] text-[#9B7B80]">
                          {t('admin.noDiscount')}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Add discount (if none) */}
                        {!hasDiscount && !isEditing && (
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            disabled={saveInProgress}
                            title={t('admin.addOffer')}
                            aria-label={t('admin.addOffer')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-40"
                            style={{ background: '#ECFDF5', color: '#059669' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#D1FAE5'}
                            onMouseLeave={e => e.currentTarget.style.background = '#ECFDF5'}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        )}
                        {/* Edit discount */}
                        {hasDiscount && !isEditing && (
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            disabled={saveInProgress}
                            title={t('admin.edit')}
                            aria-label={t('admin.edit')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-40"
                            style={{ background: '#EFF6FF', color: '#3B82F6' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
                            onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                            </svg>
                          </button>
                        )}
                        {/* Delete (remove discount) */}
                        {hasDiscount && !isEditing && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget(product)}
                            disabled={saveInProgress}
                            title={t('admin.remove')}
                            aria-label={t('admin.remove')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-40"
                            style={{ background: '#FEF2F2', color: '#EF4444' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                            onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        )}
                        {/* Full edit link (always) */}
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          title={t('admin.fullEdit')}
                          aria-label={t('admin.fullEdit')}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                          style={{ background: '#F5EDEF', color: '#6B4E53' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#EDD8DC'}
                          onMouseLeave={e => e.currentTarget.style.background = '#F5EDEF'}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        itemName={confirmTarget?.name}
        loading={saving === confirmTarget?.id}
        message={t('admin.removeDiscount') || 'Remove this discount?'}
        onConfirm={handleRemove}
        onCancel={() => setConfirmTarget(null)}
      />
      </div>
    </div>
  )
}
