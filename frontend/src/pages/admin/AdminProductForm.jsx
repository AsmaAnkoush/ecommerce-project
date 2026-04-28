import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createProduct, updateProduct, toggleProductVisibility } from '../../api/productApi'
import { getAdminProductById } from '../../api/adminApi'
import { getCategories } from '../../api/categoryApi'
import { uploadImages } from '../../api/uploadApi'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import PageHeader from '../../components/layout/PageHeader'
import ImageCropModal from '../../components/ui/ImageCropModal'
import ImagePreviewModal from '../../components/ui/ImagePreviewModal'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'

const SEASONS = [
  { value: 'SUMMER', label: 'Summer' },
  { value: 'WINTER', label: 'Winter' },
]
const MEASUREMENT_FIELDS = [
  { key: 'chest',     tKey: 'product.chest' },
  { key: 'waist',     tKey: 'product.waist' },
  { key: 'shoulders', tKey: 'product.shoulders' },
  { key: 'backWidth', tKey: 'product.backWidth' },
  { key: 'length',    tKey: 'product.length' },
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
const inputCls = 'w-full px-3 py-2.5 border border-[#EDD8DC] rounded-xl text-sm focus:outline-none focus:border-[#DFA3AD] input-focus-glow bg-white'

const loadCustomColors = () => {
  try { return JSON.parse(localStorage.getItem('adminCustomColors') || '[]') } catch { return [] }
}

export default function AdminProductForm() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const presetCategoryId = searchParams.get('category')

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // touched tracks which fields the user has interacted with.
  // Errors and green states only show for touched fields.
  const [touched, setTouched] = useState({})
  const [categories, setCategories] = useState([])
  const [active, setActive] = useState(true)
  const [togglingVisibility, setTogglingVisibility] = useState(false)

  const [form, setForm] = useState({
    name: '', description: '', price: '', stockQuantity: 0,
    imageUrl: '', brand: '', size: '', color: '', material: '',
    isBestSeller: false, isNew: true, season: '', categoryId: presetCategoryId || '',
    discountType: '', discountValue: '', confirmedOrderCount: 0,
  })

  // Main image upload
  const [mainImageFile, setMainImageFile] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState('')
  const [uploadingMain, setUploadingMain] = useState(false)
  const mainImageRef = useRef()

  // Crop modal
  const [cropSrc, setCropSrc] = useState(null)        // image source to crop
  const [cropTarget, setCropTarget] = useState(null)   // 'main' | 'general' | {type:'color', color: string}

  // Image preview lightbox
  const [previewImages, setPreviewImages] = useState(null)  // array of URLs
  const [previewIndex, setPreviewIndex] = useState(0)

  // General (non-color-specific) images
  const [generalImages, setGeneralImages] = useState([])
  const [generalPreviews, setGeneralPreviews] = useState([])
  const [uploadingGeneral, setUploadingGeneral] = useState(false)
  const generalInputRef = useRef()

  // Color entries: [{color, imageUrls: string[], sizes: [{size, stockQuantity, chest, waist, shoulders, backWidth, length}]}]
  const [colorEntries, setColorEntries] = useState([])
  const [newColorInput, setNewColorInput] = useState(() => {
    if (isEdit) return ''
    const black = NAMED_COLORS.find(c => c.name.toLowerCase() === 'black')
    return black ? black.name : (NAMED_COLORS[0]?.name ?? '')
  })
  const [newColorHex, setNewColorHex] = useState(() => {
    if (isEdit) return '#000000'
    const black = NAMED_COLORS.find(c => c.name.toLowerCase() === 'black')
    return black ? black.hex : (NAMED_COLORS[0]?.hex ?? '#000000')
  })
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
          confirmedOrderCount: p.confirmedOrderCount ?? 0,
          isNew: p.isNew ?? false,
          season: p.season ?? '',
          categoryId: p.categoryId ?? '',
          discountType: p.discountType ?? '',
          discountValue: p.discountValue ?? '',
        })
        setActive(p.active ?? true)
        if (p.imageUrl) setMainImagePreview(p.imageUrl)
        setGeneralImages([...new Set(p.imageUrls ?? [])])
        if (p.colorImages || p.variants?.length) {
          const map = {}
          if (p.colorImages) {
            Object.entries(p.colorImages).forEach(([color, entries]) => {
              const urls = [...new Set(entries.map(e => e.url))]
              const primary = entries.find(e => e.isPrimary)?.url || null
              map[color] = { color, imageUrls: urls, sizes: [], primaryImageUrl: primary }
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

  // ── Centralized validation ─────────────────────────────────────────────────
  // Computed on every render — no state needed, always reflects current form.
  const getValidationErrors = () => {
    const errs = {}
    if (!form.name?.trim())
      errs.name = 'Product name is required'
    else if (form.name.trim().length < 3)
      errs.name = 'Name must be at least 3 characters'
    if (!form.price || parseFloat(form.price) <= 0)
      errs.price = 'Price must be greater than 0'
    if (!form.categoryId)
      errs.categoryId = 'Please select a category'
    if (!form.season)
      errs.season = 'Please select a season'
    if (!colorEntries.length)
      errs.colors = 'Please add at least one color with images and sizes'
    for (const c of colorEntries) {
      const key = `color::${c.color}`
      const imgs = (c.imageUrls || []).filter(Boolean)
      const validSizes = c.sizes.filter(s => s.size?.toString().trim())
      if (imgs.length === 0)
        errs[key] = `Please upload at least one image for "${c.color}"`
      else if (validSizes.length === 0)
        errs[key] = `Please add at least one size for "${c.color}"`
      else if (validSizes.some(s => parseInt(s.stockQuantity) < 0))
        errs[key] = `Stock quantity must be 0 or more for "${c.color}"`
    }
    return errs
  }

  const validationErrors = getValidationErrors()
  const isFormValid = Object.keys(validationErrors).length === 0

  // Refs used to scroll to the first invalid field on submit.
  const fieldRefs = useRef({})
  const setFieldRef = (key) => (el) => { if (el) fieldRefs.current[key] = el }

  const touchField = (key) => setTouched(prev => ({ ...prev, [key]: true }))

  // Border helpers — only activate after the field has been touched.
  const errCls  = (key) => touched[key] &&  validationErrors[key] ? ' !border-red-400 ring-1 ring-red-300'   : ''
  const validCls = (key) => touched[key] && !validationErrors[key] ? ' !border-green-400 ring-1 ring-green-200' : ''
  const fieldCls = (key) => inputCls + errCls(key) + validCls(key)

  // Returns the error message for a field only if it has been touched.
  const fieldError = (key) => (touched[key] && validationErrors[key]) ? validationErrors[key] : null

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setTouched(prev => ({ ...prev, [k]: true }))
  }

  // ── General images ──────────────────────────────────────────────────────────
  const handleGeneralImageFiles = async (files) => {
    const fileArr = Array.from(files)
    if (!fileArr.length) return
    // Single file → open crop modal
    if (fileArr.length === 1) {
      setCropSrc(URL.createObjectURL(fileArr[0]))
      setCropTarget('general')
      return
    }
    // Multiple files → upload directly (no crop)
    setUploadingGeneral(true)
    try {
      const urls = await uploadImages(fileArr)
      setGeneralImages(prev => [...new Set([...prev, ...urls])])
    } finally { setUploadingGeneral(false) }
  }

  const removeGeneralImage = (idx) => setGeneralImages(prev => prev.filter((_, i) => i !== idx))

  // ── Color entries ───────────────────────────────────────────────────────────
  const addColorEntry = () => {
    const name = newColorInput.trim()
    if (!name) return
    if (colorEntries.some(e => e.color.toLowerCase() === name.toLowerCase())) return
    setColorEntries(prev => [...prev, { color: name, imageUrls: [], sizes: [], primaryImageUrl: null }])
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
    // Single file → open crop modal
    if (fileArr.length === 1) {
      setCropSrc(URL.createObjectURL(fileArr[0]))
      setCropTarget({ type: 'color', color })
      return
    }
    // Multiple files → upload directly
    setUploadingColor(color)
    try {
      const urls = await uploadImages(fileArr)
      setColorEntries(prev => prev.map(e =>
        e.color === color ? { ...e, imageUrls: [...new Set([...e.imageUrls, ...urls])] } : e
      ))
    } finally { setUploadingColor(null) }
  }

  const setPrimaryColorImage = (color, url) => setColorEntries(prev => prev.map(e =>
    e.color === color ? { ...e, primaryImageUrl: url } : e
  ))

  const moveColorImage = (color, idx, dir) => setColorEntries(prev => prev.map(e => {
    if (e.color !== color) return e
    const next = [...e.imageUrls]
    const j = idx + dir
    if (j < 0 || j >= next.length) return e
    ;[next[idx], next[j]] = [next[j], next[idx]]
    return { ...e, imageUrls: next }
  }))

  const removeColorImage = (color, idx) => setColorEntries(prev => prev.map(e =>
    e.color === color
      ? {
          ...e,
          imageUrls: e.imageUrls.filter((_, i) => i !== idx),
          primaryImageUrl: e.imageUrls[idx] === e.primaryImageUrl ? null : e.primaryImageUrl,
        }
      : e
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

  // ── Main image handlers ─────────────────────────────────────────────────────
  const handleMainImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
    setCropTarget('main')
    if (mainImageRef.current) mainImageRef.current.value = ''
  }

  const removeMainImage = () => {
    setMainImageFile(null)
    setMainImagePreview('')
    setField('imageUrl', '')
    if (mainImageRef.current) mainImageRef.current.value = ''
  }

  // ── Crop confirm handler ───────────────────────────────────────────────────
  const handleCropConfirm = async (croppedFile) => {
    const preview = URL.createObjectURL(croppedFile)
    const target = cropTarget

    setCropSrc(null)
    setCropTarget(null)

    if (target === 'main') {
      setMainImageFile(croppedFile)
      setMainImagePreview(preview)

    } else if (target === 'general') {
      // Show instant preview while uploading
      setGeneralPreviews(prev => [...prev, { file: croppedFile, previewUrl: preview }])
      setUploadingGeneral(true)
      try {
        const urls = await uploadImages([croppedFile])
        setGeneralImages(prev => [...prev, ...urls])
      } finally {
        setUploadingGeneral(false)
        setGeneralPreviews(prev => prev.filter(p => p.previewUrl !== preview))
        URL.revokeObjectURL(preview)
      }

    } else if (target?.type === 'color') {
      const color = target.color
      // Show instant preview while uploading
      setColorPreviews(prev => ({
        ...prev,
        [color]: [...(prev[color] || []), { file: croppedFile, previewUrl: preview }],
      }))
      setUploadingColor(color)
      try {
        const urls = await uploadImages([croppedFile])
        setColorEntries(prev =>
          prev.map(e =>
            e.color === color
              ? { ...e, imageUrls: [...new Set([...e.imageUrls, ...urls])] }
              : e
          )
        )
      } finally {
        setUploadingColor(null)
        setColorPreviews(prev => ({
          ...prev,
          [color]: (prev[color] || []).filter(p => p.previewUrl !== preview),
        }))
        URL.revokeObjectURL(preview)
      }
    }
  }

  const handleCropCancel = () => {
    setCropSrc(null)
    setCropTarget(null)
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Touch every field so all errors become visible at once.
    const allKeys = ['name', 'description', 'price', 'categoryId', 'season', 'colors',
      ...colorEntries.map(c => `color::${c.color}`)]
    setTouched(Object.fromEntries(allKeys.map(k => [k, true])))

    const errs = getValidationErrors()
    const errorKeys = Object.keys(errs)

    if (errorKeys.length) {
      setError(errs[errorKeys[0]])
      // Wait one frame so the red borders are painted before scrolling.
      requestAnimationFrame(() => {
        const first = fieldRefs.current[errorKeys[0]]
        if (first?.scrollIntoView) {
          first.scrollIntoView({ behavior: 'smooth', block: 'center' })
          try { first.focus({ preventScroll: true }) } catch { /* non-focusable */ }
        }
      })
      return
    }

    setSaving(true)
    try {
      // Main image priority: explicit primary on the first color → first image of first color.
      const firstColor = colorEntries[0]
      const mainImageUrl =
        (firstColor?.primaryImageUrl && firstColor.imageUrls.includes(firstColor.primaryImageUrl))
          ? firstColor.primaryImageUrl
          : (firstColor?.imageUrls?.find(Boolean) || null)

      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        stockQuantity: colorEntries.reduce((sum, e) => sum + e.sizes.reduce((s2, sz) => s2 + (parseInt(sz.stockQuantity) || 0), 0), 0),
        imageUrl: mainImageUrl,
        brand: null,
        size: null,
        color: null,
        material: null,
        isBestSeller: false,
        isNew: false,
        season: form.season || null,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        discountType: form.discountType || null,
        discountValue: form.discountValue ? parseFloat(form.discountValue) : null,
        imageUrls: [],
        colorImages: colorEntries.map(e => {
          const urls = [...new Set(e.imageUrls.filter(Boolean))]
          return {
            color: e.color,
            imageUrls: urls,
            primaryImageUrl: e.primaryImageUrl && urls.includes(e.primaryImageUrl) ? e.primaryImageUrl : null,
          }
        }),
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
        toast(t('admin.updatedSuccess'))
      } else {
        await createProduct(payload)
        toast(t('admin.productCreated') || '🎉 تم إضافة منتجك بنجاح')
        navigate('/admin/products')
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('admin.failedSave')
      setError(msg)
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleVisibility = async () => {
    if (!isEdit || togglingVisibility) return
    setTogglingVisibility(true)
    try {
      const res = await toggleProductVisibility(id)
      const next = res?.data?.data?.active ?? !active
      setActive(next)
      toast(next ? t('admin.visibleToUsers') : t('admin.hiddenFromUsers'))
    } catch (err) {
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally {
      setTogglingVisibility(false)
    }
  }

  if (loading) return <div className="flex justify-center py-40"><Spinner size="lg" /></div>

  return (
    <>
      <PageHeader />
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 sm:p-8 pt-0 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? t('admin.edit') : t('admin.addProduct')}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {isEdit && (
            <>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                  active
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
                title={active ? t('admin.visibleToUsers') : t('admin.hiddenFromUsers')}
              >
                <span aria-hidden="true">{active ? '👁️' : '🚫'}</span>
                {active ? t('admin.visibleToUsers') : t('admin.hiddenFromUsers')}
              </span>
              <button
                type="button"
                onClick={handleToggleVisibility}
                disabled={togglingVisibility}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {togglingVisibility ? '…' : (active ? t('admin.hide') : t('admin.show'))}
              </button>
              <Link
                to={`/products/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#EDD8DC] text-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('admin.preview')}
              </Link>
            </>
          )}
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/products')}>{t('admin.cancel')}</Button>
          <Button type="submit" loading={saving} disabled={!isFormValid || saving}>{t('admin.save')}</Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

      {/* ── Basic Info ── */}
      <Section title={t('admin.description')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>{t('admin.name')} *</Label>
            <input
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              onBlur={() => touchField('name')}
              ref={setFieldRef('name')}
              className={fieldCls('name')}
              placeholder="e.g. Classic Linen Shirt (min 3 chars)"
            />
            {fieldError('name')
              ? <p className="mt-1 text-xs text-red-600">{fieldError('name')}</p>
              : touched.name && <p className="mt-1 text-xs text-green-600">Looks good</p>
            }
          </div>
          <div className="md:col-span-2">
            <Label>{t('product.description')} *</Label>
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              onBlur={() => touchField('description')}
              ref={setFieldRef('description')}
              rows={3}
              className={`resize-none ` + fieldCls('description')}
              placeholder={t('admin.productDescriptionPlaceholder')}
            />
            {fieldError('description')
              ? <p className="mt-1 text-xs text-red-600">{fieldError('description')}</p>
              : touched.description && <p className="mt-1 text-xs text-green-600">Looks good</p>
            }
          </div>
          <div>
            <Label>{t('admin.price')} *</Label>
            <input
              type="number" min="0.01" step="0.01"
              value={form.price}
              onChange={e => setField('price', e.target.value)}
              onBlur={() => touchField('price')}
              ref={setFieldRef('price')}
              className={fieldCls('price')}
              placeholder="0.00"
            />
            {fieldError('price')
              ? <p className="mt-1 text-xs text-red-600">{fieldError('price')}</p>
              : touched.price && <p className="mt-1 text-xs text-green-600">Valid price</p>
            }
          </div>
          <div>
            <Label>{t('product.quantity')} <span className="text-gray-400 font-normal text-xs">({t('admin.autoCalculated')})</span></Label>
            <div className={`${inputCls} bg-gray-50 text-gray-500 cursor-default select-none`}>
              {colorEntries.reduce((sum, e) => sum + e.sizes.reduce((s2, sz) => s2 + (parseInt(sz.stockQuantity) || 0), 0), 0)} {t('admin.pieces')}
            </div>
          </div>
          <div>
            <Label>{t('admin.categories')} *</Label>
            <select
              value={form.categoryId}
              onChange={e => setField('categoryId', e.target.value)}
              onBlur={() => touchField('categoryId')}
              ref={setFieldRef('categoryId')}
              className={fieldCls('categoryId')}
            >
              <option value="">{t('admin.selectNone')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {fieldError('categoryId')
              ? <p className="mt-1 text-xs text-red-600">{fieldError('categoryId')}</p>
              : touched.categoryId && <p className="mt-1 text-xs text-green-600">Category selected</p>
            }
          </div>
          <div>
            <Label>{t('admin.season')} *</Label>
            <select
              value={form.season}
              onChange={e => setField('season', e.target.value)}
              onBlur={() => touchField('season')}
              ref={setFieldRef('season')}
              className={fieldCls('season')}
            >
              <option value="">{t('admin.selectNone')}</option>
              {SEASONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {fieldError('season')
              ? <p className="mt-1 text-xs text-red-600">{fieldError('season')}</p>
              : touched.season && <p className="mt-1 text-xs text-green-600">Season selected</p>
            }
          </div>
        </div>
      </Section>

      {/* ── Discount ── */}
      <Section title={t('admin.discount')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('admin.discountType')}</Label>
            <select value={form.discountType} onChange={e => setField('discountType', e.target.value)} className={inputCls}>
              <option value="">{t('admin.selectNone')}</option>
              <option value="PERCENTAGE">{t('admin.discountPercentage')}</option>
              <option value="FIXED">{t('admin.discountFixed')}</option>
            </select>
          </div>
          {form.discountType && (
            <div>
              <Label>{form.discountType === 'PERCENTAGE' ? t('admin.discountValuePercent') : t('admin.discountValueFixed')}</Label>
              <input type="number" min="0" step="0.01" value={form.discountValue}
                onChange={e => setField('discountValue', e.target.value)} className={inputCls}
                placeholder={form.discountType === 'PERCENTAGE' ? '10' : '49.99'} />
            </div>
          )}
        </div>
      </Section>

      {/* ── Color Entries ── */}
      <Section title={t('product.color')} sectionRef={setFieldRef('colors')} hasError={!!fieldError('colors')}>
        <div className="space-y-6">
          {/* Add color UI */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">{t('admin.addColor')}</p>
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
                placeholder={t('admin.colorNamePlaceholder')} />
              <Button type="button" size="sm" onClick={addColorEntry}>{t('admin.addLabel')}</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[...NAMED_COLORS, ...customColors].map(c => {
                const alreadyAdded = colorEntries.some(e => e.color.toLowerCase() === c.name.toLowerCase())
                const isSelected = !alreadyAdded && newColorInput.toLowerCase() === c.name.toLowerCase()
                return (
                  <button key={c.name} type="button" disabled={alreadyAdded}
                    onClick={() => { setNewColorInput(c.name); setNewColorHex(c.hex) }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all ${
                      alreadyAdded
                        ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                        : isSelected
                          ? 'border-[#6B1F2A] text-[#6B1F2A] bg-[#FDF0F2] ring-1 ring-[#6B1F2A]/30 font-semibold'
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
            <p className={`text-sm italic text-center py-4 ${fieldError('colors') ? 'text-red-600' : 'text-gray-400'}`}>
              {fieldError('colors') || 'No colors added yet. Use the form above to add colors with images and sizes.'}
            </p>
          )}

          {colorEntries.map(entry => {
            const { color, imageUrls, sizes, primaryImageUrl } = entry
            const effectivePrimary = (primaryImageUrl && imageUrls.includes(primaryImageUrl))
              ? primaryImageUrl
              : imageUrls[0]
            const previews = colorPreviews[color] || []
            const sizeInp = getSizeInput(color)

            const colorErr = fieldError(`color::${color}`)
            return (
              <div key={color}
                ref={setFieldRef(`color::${color}`)}
                className={`border rounded-2xl overflow-hidden shadow-sm ${colorErr ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-200'}`}>
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
                    {t('admin.delete')}
                  </button>
                </div>

                <div className="p-4 space-y-5">
                  {colorErr && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {colorErr}
                    </p>
                  )}
                  {/* Images for this color */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('admin.image')}</p>
                    <div className="flex flex-wrap gap-2">
                      {imageUrls.map((url, i) => {
                        const isMain = url === effectivePrimary
                        return (
                          <div key={i} className={`relative w-24 h-24 rounded-xl overflow-hidden group transition-all ${isMain ? 'border-2 border-[#6B1F2A] ring-2 ring-[#FDF0F2]' : 'border border-gray-200'}`}>
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            {isMain && (
                              <span className="absolute top-1 start-1 text-[9px] font-semibold uppercase tracking-wide bg-[#6B1F2A] text-white px-1.5 py-0.5 rounded-md shadow-sm z-10">
                                ⭐ {t('admin.main') || 'Main'}
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => setPrimaryColorImage(color, url)}
                                  title={t('admin.setMain') || 'Set as main'}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isMain ? 'bg-amber-400 text-white' : 'bg-white/20 hover:bg-amber-400/80 text-white'}`}>
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                </button>
                                <button type="button" onClick={() => removeColorImage(color, i)}
                                  title={t('admin.delete') || 'Delete'}
                                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-red-500/80 flex items-center justify-center transition-colors">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => moveColorImage(color, i, -1)} disabled={i === 0}
                                  title={t('admin.moveLeft') || 'Move left'}
                                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <button type="button" onClick={() => moveColorImage(color, i, +1)} disabled={i === imageUrls.length - 1}
                                  title={t('admin.moveRight') || 'Move right'}
                                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {previews.map((p, i) => (
                        <div key={`cp-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                          <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                            <svg className="animate-spin w-4 h-4 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                          </div>
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
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('product.size')} & {t('product.quantity')}</p>

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
                              <span className="text-xs text-gray-400 shrink-0">{t('admin.pieces')}</span>
                              <button type="button" onClick={() => toggleSizeExpand(color, s.size)}
                                className={`ml-auto text-xs px-2 py-1 rounded-lg border transition-all ${
                                  isExpanded || hasMeasurements
                                    ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                                }`}>
                                {hasMeasurements ? t('admin.measurementsSetLabel') : t('admin.measurementsLabel')}
                              </button>
                              <button type="button" onClick={() => removeSizeFromColor(color, s.size)}
                                className="text-red-400 hover:text-red-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-lg font-bold shrink-0 transition-colors">
                                ×
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="px-3 py-3 bg-white border-t border-gray-100">
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                  {MEASUREMENT_FIELDS.map(f => (
                                    <div key={f.key}>
                                      <p className="text-xs text-gray-400 text-center mb-1">{t(f.tKey)} <span className="text-gray-300">({t('product.cm')})</span></p>
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
                        placeholder={t('admin.customSizePlaceholder')} />
                      <Button type="button" size="sm" variant="secondary" onClick={() => addSizeToColor(color)}>
                        {t('product.size')}
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
        <Button type="button" variant="secondary" onClick={() => navigate('/admin/products')}>{t('admin.cancel')}</Button>
        <Button type="submit" loading={saving} disabled={!isFormValid || saving}>{t('admin.save')}</Button>
      </div>

      {/* Crop modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={3 / 4}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* Image preview lightbox */}
      {previewImages && (
        <ImagePreviewModal
          images={previewImages}
          index={previewIndex}
          onClose={() => setPreviewImages(null)}
          onChange={setPreviewIndex}
        />
      )}
      </form>
    </>
  )
}

function Section({ title, children, sectionRef, hasError }) {
  return (
    <div ref={sectionRef}
      className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${hasError ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-200'}`}>
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
