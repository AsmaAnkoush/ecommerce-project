import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createProduct, updateProduct } from '../../api/productApi'
import { getAdminProductById } from '../../api/adminApi'
import { getCategories } from '../../api/categoryApi'
import { uploadImages } from '../../api/uploadApi'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const SEASONS = ['SPRING', 'SUMMER', 'FALL', 'WINTER', 'ALL']
const MEASUREMENT_FIELDS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'backWidth', label: 'Back' },
  { key: 'length', label: 'Length' },
]
const NAMED_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy Blue', hex: '#001F5B' },
  { name: 'Beige', hex: '#F5F0E8' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Red', hex: '#CC0000' },
  { name: 'Green', hex: '#2D6A4F' },
  { name: 'Gray', hex: '#6B6B6B' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Olive', hex: '#6B7C44' },
  { name: 'Coral', hex: '#FF6B6B' },
  { name: 'Pink', hex: '#FFB6C1' },
  { name: 'Cream', hex: '#FFFDD0' },
]
const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', '46']
const EMPTY_SIZE_INPUT = { size: '', stockQuantity: 0, chest: '', waist: '', shoulders: '', backWidth: '', length: '' }
const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B1F2A] bg-white'

const loadCustomColors = () => {
  try { return JSON.parse(localStorage.getItem('adminCustomColors') || '[]') } catch { return [] }
}

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])

  const [form, setForm] = useState({
    name: '', description: '', price: '', stockQuantity: 0,
    imageUrl: '', brand: '', size: '', color: '', material: '',
    isBestSeller: false, isNew: false, season: '', categoryId: '',
    discountType: '', discountValue: '',
  })

  // General (non-color-specific) images
  const [generalImages, setGeneralImages] = useState([])
  const [generalPreviews, setGeneralPreviews] = useState([])
  const [uploadingGeneral, setUploadingGeneral] = useState(false)
  const generalInputRef = useRef()

  // Color entries: [{color, imageUrls: string[], sizes: [{size, stockQuantity, chest, waist, shoulders, backWidth, length}]}]
  const [colorEntries, setColorEntries] = useState([])
  const [newColorInput, setNewColorInput] = useState('')
  const [newColorHex, setNewColorHex] = useState('#000000')
  const [customColors, setCustomColors] = useState(loadCustomColors)
  const [uploadingColor, setUploadingColor] = useState(null)
  const [colorPreviews, setColorPreviews] = useState({})
  const [sizeInputs, setSizeInputs] = useState({})
  const [expandedSizes, setExpandedSizes] = useState(new Set())

  useEffect(() => {
    getCategories().then(r => setCategories(r.data.data ?? []))
    if (!isEdit) return
    getAdminProductById(id)
      .then(r => {
        const p = r.data.data
        setForm({
          name: p.name ?? '',
          description: p.description ?? '',
          price: p.price ?? '',
          stockQuantity: p.stockQuantity ?? 0,
          imageUrl: p.imageUrl ?? '',
          brand: p.brand ?? '',
          size: p.size ?? '',
          color: p.color ?? '',
          material: p.material ?? '',
          isBestSeller: p.isBestSeller ?? false,
          isNew: p.isNew ?? false,
          season: p.season ?? '',
          categoryId: p.categoryId ?? '',
          discountType: p.discountType ?? '',
          discountValue: p.discountValue ?? '',
        })
        setGeneralImages([...new Set(p.imageUrls ?? [])])
        if (p.colorImages || p.variants?.length) {
          const map = {}
          if (p.colorImages) {
            Object.entries(p.colorImages).forEach(([color, entries]) => {
              const urls = [...new Set(entries.map(e => e.url))]
              map[color] = { color, imageUrls: urls, sizes: [] }
            })
          }
          if (p.variants) {
            p.variants.forEach(v => {
              if (!v.color) return
              if (!map[v.color]) map[v.color] = { color: v.color, imageUrls: [], sizes: [] }
              const alreadyExists = map[v.color].sizes.some(s => s.size === v.size)
              if (!alreadyExists) {
                map[v.color].sizes.push({
                  size: v.size,
                  stockQuantity: v.stockQuantity ?? 0,
                  chest: v.chest ?? '',
                  waist: v.waist ?? '',
                  shoulders: v.shoulders ?? '',
                  backWidth: v.backWidth ?? '',
                  length: v.length ?? '',
                })
              }
            })
          }
          setColorEntries(Object.values(map))
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── General images ──────────────────────────────────────────────────────────
  const handleGeneralImageFiles = async (files) => {
    const fileArr = Array.from(files)
    if (!fileArr.length) return
    const previews = fileArr.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))
    setGeneralPreviews(prev => [...prev, ...previews])
    setUploadingGeneral(true)
    try {
      const urls = await uploadImages(fileArr)
      setGeneralImages(prev => [...new Set([...prev, ...urls])])
    } finally {
      setUploadingGeneral(false)
      previews.forEach(p => URL.revokeObjectURL(p.previewUrl))
      setGeneralPreviews([])
    }
  }

  const removeGeneralImage = (idx) => setGeneralImages(prev => prev.filter((_, i) => i !== idx))

  // ── Color entries ───────────────────────────────────────────────────────────
  const addColorEntry = () => {
    const name = newColorInput.trim()
    if (!name) return
    if (colorEntries.some(e => e.color.toLowerCase() === name.toLowerCase())) return
    setColorEntries(prev => [...prev, { color: name, imageUrls: [], sizes: [] }])
    const isHex = /^#[0-9A-Fa-f]{6}$/.test(name)
    const alreadySaved = NAMED_COLORS.some(c => c.name === name) || customColors.some(c => c.name === name)
    if (!isHex && !alreadySaved) {
      const updated = [...customColors, { name, hex: newColorHex }]
      setCustomColors(updated)
      localStorage.setItem('adminCustomColors', JSON.stringify(updated))
    }
    setNewColorInput('')
    setNewColorHex('#000000')
  }

  const removeColorEntry = (color) => {
    setColorEntries(prev => prev.filter(e => e.color !== color))
    setColorPreviews(prev => { const n = { ...prev }; delete n[color]; return n })
    setSizeInputs(prev => { const n = { ...prev }; delete n[color]; return n })
  }

  // ── Per-color images ────────────────────────────────────────────────────────
  const handleColorImageFiles = async (color, files) => {
    const fileArr = Array.from(files)
    if (!fileArr.length) return
    const previews = fileArr.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))
    setColorPreviews(prev => ({ ...prev, [color]: [...(prev[color] || []), ...previews] }))
    setUploadingColor(color)
    try {
      const urls = await uploadImages(fileArr)
      setColorEntries(prev => prev.map(e =>
        e.color === color ? { ...e, imageUrls: [...new Set([...e.imageUrls, ...urls])] } : e
      ))
    } finally {
      setUploadingColor(null)
      previews.forEach(p => URL.revokeObjectURL(p.previewUrl))
      setColorPreviews(prev => ({ ...prev, [color]: [] }))
    }
  }

  const removeColorImage = (color, idx) => setColorEntries(prev => prev.map(e =>
    e.color === color ? { ...e, imageUrls: e.imageUrls.filter((_, i) => i !== idx) } : e
  ))

  // ── Sizes ───────────────────────────────────────────────────────────────────
  const getSizeInput = (color) => sizeInputs[color] ?? { ...EMPTY_SIZE_INPUT }
  const setSizeInput = (color, val) => setSizeInputs(prev => ({ ...prev, [color]: val }))

  const addSizeToColor = (color, sizeOverride) => {
    const inp = getSizeInput(color)
    const sz = (sizeOverride ?? inp.size ?? '').toString().trim()
    if (!sz) return
    setColorEntries(prev => prev.map(e => {
      if (e.color !== color) return e
      if (e.sizes.some(s => s.size === sz)) return e
      return {
        ...e,
        sizes: [...e.sizes, {
          size: sz,
          stockQuantity: parseInt(inp.stockQuantity) || 0,
          chest: inp.chest || null,
          waist: inp.waist || null,
          shoulders: inp.shoulders || null,
          backWidth: inp.backWidth || null,
          length: inp.length || null,
        }],
      }
    }))
    setSizeInput(color, { ...EMPTY_SIZE_INPUT })
  }

  const removeSizeFromColor = (color, size) => {
    setColorEntries(prev => prev.map(e =>
      e.color === color ? { ...e, sizes: e.sizes.filter(s => s.size !== size) } : e
    ))
    setExpandedSizes(prev => { const n = new Set(prev); n.delete(`${color}::${size}`); return n })
  }

  const updateSizeField = (color, size, field, value) => {
    setColorEntries(prev => prev.map(e => {
      if (e.color !== color) return e
      return {
        ...e,
        sizes: e.sizes.map(s => {
          if (s.size !== size) return s
          const parsed = field === 'stockQuantity'
            ? (parseInt(value) || 0)
            : (value === '' ? null : parseFloat(value))
          return { ...s, [field]: parsed }
        }),
      }
    }))
  }

  const toggleSizeExpand = (color, size) => {
    setExpandedSizes(prev => {
      const n = new Set(prev)
      const key = `${color}::${size}`
      if (n.has(key)) n.delete(key); else n.add(key)
      return n
    })
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        stockQuantity: colorEntries.reduce((sum, e) => sum + e.sizes.reduce((s2, sz) => s2 + (parseInt(sz.stockQuantity) || 0), 0), 0),
        imageUrl: form.imageUrl || null,
        brand: form.brand || null,
        size: form.size || null,
        color: form.color || null,
        material: form.material || null,
        isBestSeller: form.isBestSeller,
        isNew: form.isNew,
        season: form.season || null,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        discountType: form.discountType || null,
        discountValue: form.discountValue ? parseFloat(form.discountValue) : null,
        imageUrls: [...new Set(generalImages.filter(Boolean))],
        colorImages: colorEntries.map(e => ({
          color: e.color,
          imageUrls: [...new Set(e.imageUrls.filter(Boolean))],
        })),
        variants: colorEntries.flatMap(e =>
          e.sizes
            .filter(s => s.size && s.size.toString().trim())
            .map(s => ({
              color: e.color,
              size: s.size,
              stockQuantity: parseInt(s.stockQuantity) || 0,
              chest: s.chest ?? null,
              waist: s.waist ?? null,
              shoulders: s.shoulders ?? null,
              backWidth: s.backWidth ?? null,
              length: s.length ?? null,
            }))
        ),
      }
      if (isEdit) {
        await updateProduct(id, payload)
      } else {
        await createProduct(payload)
      }
      navigate('/admin/products')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-40"><Spinner size="lg" /></div>

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/products')}>Cancel</Button>
          <Button type="submit" loading={saving}>Save Product</Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

      {/* ── Basic Info ── */}
      <Section title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Product Name *</Label>
            <input required value={form.name} onChange={e => setField('name', e.target.value)}
              className={inputCls} placeholder="e.g. Classic Linen Shirt" />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)}
              rows={3} className={`${inputCls} resize-none`} placeholder="Product description..." />
          </div>
          <div>
            <Label>Price *</Label>
            <input required type="number" min="0" step="0.01" value={form.price}
              onChange={e => setField('price', e.target.value)} className={inputCls} placeholder="0.00" />
          </div>
          <div>
            <Label>Total Stock <span className="text-gray-400 font-normal text-xs">(auto-calculated)</span></Label>
            <div className={`${inputCls} bg-gray-50 text-gray-500 cursor-default select-none`}>
              {colorEntries.reduce((sum, e) => sum + e.sizes.reduce((s2, sz) => s2 + (parseInt(sz.stockQuantity) || 0), 0), 0)} pcs
            </div>
          </div>
          <div>
            <Label>Category</Label>
            <select value={form.categoryId} onChange={e => setField('categoryId', e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Brand</Label>
            <input value={form.brand} onChange={e => setField('brand', e.target.value)}
              className={inputCls} placeholder="Brand name" />
          </div>
          <div>
            <Label>Material</Label>
            <input value={form.material} onChange={e => setField('material', e.target.value)}
              className={inputCls} placeholder="e.g. 100% Cotton" />
          </div>
          <div>
            <Label>Season</Label>
            <select value={form.season} onChange={e => setField('season', e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {SEASONS.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <Label>Default Size <span className="text-gray-400 font-normal text-xs">(non-variant)</span></Label>
            <input value={form.size} onChange={e => setField('size', e.target.value)}
              className={inputCls} placeholder="e.g. M" />
          </div>
          <div>
            <Label>Default Color <span className="text-gray-400 font-normal text-xs">(non-variant)</span></Label>
            <input value={form.color} onChange={e => setField('color', e.target.value)}
              className={inputCls} placeholder="e.g. Black" />
          </div>
          <div className="md:col-span-2">
            <Label>Main Image URL</Label>
            <input value={form.imageUrl} onChange={e => setField('imageUrl', e.target.value)}
              className={inputCls} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <input type="checkbox" id="bestSeller" checked={form.isBestSeller}
              onChange={e => setField('isBestSeller', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-[#6B1F2A]" />
            <label htmlFor="bestSeller" className="text-sm font-medium text-gray-700 cursor-pointer">Mark as Best Seller</label>
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <input type="checkbox" id="isNew" checked={form.isNew}
              onChange={e => setField('isNew', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-[#6B1F2A]" />
            <label htmlFor="isNew" className="text-sm font-medium text-gray-700 cursor-pointer">Mark as New Arrival</label>
          </div>
        </div>
      </Section>

      {/* ── Discount ── */}
      <Section title="Discount">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Discount Type</Label>
            <select value={form.discountType} onChange={e => setField('discountType', e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Price</option>
            </select>
          </div>
          {form.discountType && (
            <div>
              <Label>{form.discountType === 'PERCENTAGE' ? 'Discount %' : 'Sale Price ($)'}</Label>
              <input type="number" min="0" step="0.01" value={form.discountValue}
                onChange={e => setField('discountValue', e.target.value)} className={inputCls}
                placeholder={form.discountType === 'PERCENTAGE' ? '10' : '49.99'} />
            </div>
          )}
        </div>
      </Section>

      {/* ── General Images ── */}
      <Section title="Product Images (General)">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 min-h-[5rem]">
            {generalImages.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeGeneralImage(i)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-2xl font-bold">
                  ×
                </button>
              </div>
            ))}
            {generalPreviews.map((p, i) => (
              <div key={`gp-${i}`} className="w-20 h-20 rounded-xl overflow-hidden border border-dashed border-gray-300 opacity-50">
                <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {generalImages.length === 0 && generalPreviews.length === 0 && (
              <p className="text-sm text-gray-400 italic self-center">No general images uploaded.</p>
            )}
          </div>
          <div>
            <input ref={generalInputRef} type="file" multiple accept="image/*" className="hidden"
              onChange={e => { handleGeneralImageFiles(e.target.files); e.target.value = '' }} />
            <Button type="button" variant="secondary" size="sm" loading={uploadingGeneral}
              onClick={() => generalInputRef.current?.click()}>
              Upload Images
            </Button>
          </div>
        </div>
      </Section>

      {/* ── Color Entries ── */}
      <Section title="Product Colors">
        <div className="space-y-6">
          {/* Add color UI */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Add a Color</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 rounded-xl border-2 border-gray-200 shrink-0 shadow-inner"
                style={{ backgroundColor: newColorInput.startsWith('#') ? newColorInput : (newColorHex || '#e5e7eb') }} />
              <input type="color" value={newColorHex}
                onChange={e => { setNewColorHex(e.target.value); setNewColorInput(e.target.value) }}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5 shrink-0" />
              <input
                value={newColorInput}
                onChange={e => {
                  setNewColorInput(e.target.value)
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setNewColorHex(e.target.value)
                }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColorEntry())}
                className="flex-1 min-w-[140px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6B1F2A] bg-white"
                placeholder="Color name or #hex" />
              <Button type="button" size="sm" onClick={addColorEntry}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[...NAMED_COLORS, ...customColors].map(c => {
                const alreadyAdded = colorEntries.some(e => e.color.toLowerCase() === c.name.toLowerCase())
                return (
                  <button key={c.name} type="button" disabled={alreadyAdded}
                    onClick={() => { setNewColorInput(c.name); setNewColorHex(c.hex) }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all ${
                      alreadyAdded
                        ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                        : 'border-gray-200 hover:border-[#6B1F2A] text-gray-600 hover:text-[#6B1F2A] bg-white'
                    }`}>
                    <span className="w-3 h-3 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Color cards */}
          {colorEntries.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-4">
              No colors added yet. Use the form above to add colors with images and sizes.
            </p>
          )}

          {colorEntries.map(entry => {
            const { color, imageUrls, sizes } = entry
            const previews = colorPreviews[color] || []
            const sizeInp = getSizeInput(color)

            return (
              <div key={color} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Color header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-gray-300 shadow-sm shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-semibold text-gray-800">{color}</span>
                    <span className="text-xs text-gray-400">
                      {imageUrls.length} img · {sizes.length} size{sizes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button type="button" onClick={() => removeColorEntry(color)}
                    className="text-red-400 hover:text-red-600 transition-colors text-sm font-medium">
                    Remove
                  </button>
                </div>

                <div className="p-4 space-y-5">
                  {/* Images for this color */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Images</p>
                    <div className="flex flex-wrap gap-2">
                      {imageUrls.map((url, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeColorImage(color, i)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-2xl font-bold">
                            ×
                          </button>
                        </div>
                      ))}
                      {previews.map((p, i) => (
                        <div key={`cp-${i}`} className="w-20 h-20 rounded-xl overflow-hidden border border-dashed border-gray-300 opacity-50">
                          <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#6B1F2A] transition-colors text-gray-400 hover:text-[#6B1F2A]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs mt-1">{uploadingColor === color ? '...' : 'Add'}</span>
                        <input type="file" multiple accept="image/*" className="hidden"
                          onChange={e => { handleColorImageFiles(color, e.target.files); e.target.value = '' }} />
                      </label>
                    </div>
                  </div>

                  {/* Sizes & Measurements */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sizes & Stock</p>

                    {/* Size rows */}
                    <div className="space-y-2">
                      {sizes.map((s, idx) => {
                        const expandKey = `${color}::${s.size}`
                        const isExpanded = expandedSizes.has(expandKey)
                        const hasMeasurements = MEASUREMENT_FIELDS.some(f => s[f.key] != null && s[f.key] !== '')
                        return (
                          <div key={`${s.size}-${idx}`} className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                              <span className="text-sm font-bold text-gray-800 w-10 shrink-0">{s.size}</span>
                              <input type="number" min="0" value={s.stockQuantity}
                                onChange={e => updateSizeField(color, s.size, 'stockQuantity', e.target.value)}
                                className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:border-[#6B1F2A]" />
                              <span className="text-xs text-gray-400 shrink-0">pcs</span>
                              <button type="button" onClick={() => toggleSizeExpand(color, s.size)}
                                className={`ml-auto text-xs px-2 py-1 rounded-lg border transition-all ${
                                  isExpanded || hasMeasurements
                                    ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                                }`}>
                                {hasMeasurements ? '✓ Measurements' : 'Measurements'}
                              </button>
                              <button type="button" onClick={() => removeSizeFromColor(color, s.size)}
                                className="text-red-400 hover:text-red-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-lg font-bold shrink-0 transition-colors">
                                ×
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="px-3 py-3 bg-white border-t border-gray-100">
                                <div className="grid grid-cols-5 gap-2">
                                  {MEASUREMENT_FIELDS.map(f => (
                                    <div key={f.key}>
                                      <p className="text-xs text-gray-400 text-center mb-1">{f.label} <span className="text-gray-300">(cm)</span></p>
                                      <input type="number" min="0" step="0.5"
                                        value={s[f.key] ?? ''}
                                        onChange={e => updateSizeField(color, s.size, f.key, e.target.value)}
                                        placeholder="—"
                                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:border-[#6B1F2A]" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Quick-add common sizes */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {COMMON_SIZES.filter(sz => !sizes.some(s => s.size === sz)).map(sz => (
                        <button key={sz} type="button" onClick={() => addSizeToColor(color, sz)}
                          className="px-2.5 py-1 text-xs border border-dashed border-gray-300 rounded-lg hover:border-[#6B1F2A] hover:text-[#6B1F2A] transition-all text-gray-500">
                          + {sz}
                        </button>
                      ))}
                    </div>

                    {/* Custom size input */}
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={sizeInp.size}
                        onChange={e => setSizeInput(color, { ...sizeInp, size: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSizeToColor(color))}
                        className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#6B1F2A]"
                        placeholder="Custom size…" />
                      <Button type="button" size="sm" variant="secondary" onClick={() => addSizeToColor(color)}>
                        Add Size
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

      <div className="flex justify-end gap-3 pb-8">
        <Button type="button" variant="secondary" onClick={() => navigate('/admin/products')}>Cancel</Button>
        <Button type="submit" loading={saving}>Save Product</Button>
      </div>
    </form>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Label({ children }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
}
