import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { updateProduct } from '../../api/productApi'
import { getAdminProducts } from '../../api/adminApi'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'

function DiscountBadge({ original, discounted }) {
  if (!discounted || discounted >= original) return null
  const pct = Math.round((1 - discounted / original) * 100)
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
      -{pct}%
    </span>
  )
}

export default function AdminOffers() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active') // 'active' | 'all'
  const [editingId, setEditingId] = useState(null)
  const [discountInput, setDiscountInput] = useState('')
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await getAdminProducts({ size: 200 })
      setProducts(res.data.data?.content ?? res.data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onSale = products.filter(p => p.discountPrice && p.discountPrice < p.price)
  const displayed = tab === 'active' ? onSale : products

  const startEdit = (product) => {
    setEditingId(product.id)
    setDiscountInput(product.discountPrice ? String(product.discountPrice) : '')
    setError('')
  }

  const cancelEdit = () => { setEditingId(null); setDiscountInput(''); setError('') }

  const handleSave = async (product) => {
    const val = parseFloat(discountInput)
    if (isNaN(val) || val <= 0) {
      setError('Enter a valid discount price')
      return
    }
    if (val >= product.price) {
      setError('Discount price must be less than the original price')
      return
    }
    setSaving(product.id)
    try {
      await updateProduct(product.id, {
        name: product.name,
        description: product.description || '',
        price: product.price,
        discountPrice: val,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl || '',
        additionalImages: product.additionalImages || [],
        brand: product.brand || '',
        material: product.material || '',
        categoryId: product.categoryId,
        isBestSeller: product.isBestSeller || false,
        variants: product.variants || [],
      })
      cancelEdit()
      await load()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  const handleRemove = async (product) => {
    if (!confirm('Remove the discount from this product?')) return
    setSaving(product.id)
    try {
      await updateProduct(product.id, {
        name: product.name,
        description: product.description || '',
        price: product.price,
        discountPrice: null,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl || '',
        additionalImages: product.additionalImages || [],
        brand: product.brand || '',
        material: product.material || '',
        categoryId: product.categoryId,
        isBestSeller: product.isBestSeller || false,
        variants: product.variants || [],
      })
      await load()
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers & Discounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {onSale.length} active offer{onSale.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { key: 'active', label: `Active Offers (${onSale.length})` },
          { key: 'all', label: `All Products (${products.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
          {tab === 'active' ? (
            <>
              <p className="font-medium">No active offers</p>
              <p className="text-sm mt-1">Switch to "All Products" to add discounts.</p>
            </>
          ) : (
            <p className="font-medium">No products found</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left hidden sm:table-cell">Original Price</th>
                <th className="px-5 py-3 text-left">Discount Price</th>
                <th className="px-5 py-3 text-left hidden md:table-cell">Saving</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[160px]">{product.name}</p>
                        {product.categoryName && (
                          <p className="text-xs text-gray-400 truncate">{product.categoryName}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell text-gray-600">
                    ₪{Number(product.price).toFixed(0)}
                  </td>
                  <td className="px-5 py-3">
                    {editingId === product.id ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">₪</span>
                          <input
                            type="number"
                            value={discountInput}
                            onChange={e => { setDiscountInput(e.target.value); setError('') }}
                            step="0.01"
                            min="0.01"
                            max={product.price - 0.01}
                            placeholder="0.00"
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-700"
                            autoFocus
                          />
                        </div>
                        {error && <p className="text-xs text-red-500">{error}</p>}
                      </div>
                    ) : product.discountPrice && product.discountPrice < product.price ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-red-600">₪{Number(product.discountPrice).toFixed(0)}</span>
                        <DiscountBadge original={product.price} discounted={product.discountPrice} />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No discount</span>
                    )}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {product.discountPrice && product.discountPrice < product.price ? (
                      <span className="text-green-600 font-medium text-xs">
                        Save ₪{(Number(product.price) - Number(product.discountPrice)).toFixed(0)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === product.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSave(product)}
                            loading={saving === product.id}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="secondary" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(product)}
                            disabled={saving === product.id}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          >
                            {product.discountPrice && product.discountPrice < product.price ? 'Edit' : 'Add Offer'}
                          </button>
                          {product.discountPrice && product.discountPrice < product.price && (
                            <button
                              onClick={() => handleRemove(product)}
                              disabled={saving === product.id}
                              className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
                            >
                              {saving === product.id ? '...' : 'Remove'}
                            </button>
                          )}
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="text-xs font-medium text-gray-400 hover:text-gray-600"
                          >
                            Full Edit
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
