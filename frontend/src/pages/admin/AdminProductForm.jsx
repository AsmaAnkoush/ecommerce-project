import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
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
const MAX_COLOR_IMAGES = 10
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
  const [successMessage, setSuccessMessage] = useState('')
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
  const [showColorPicker, setShowColorPicker] = useState(false)
  // Maps uploaded URL → original File so images can be re-cropped after upload
  const [originalFiles, setOriginalFiles] = useState(() => new Map())
  // Staged (selected but not yet uploaded) files per color
  const [stagedFiles, setStagedFiles] = useState({})
  // Color editing
  const [editingColor, setEditingColor]               = useState(null)
  const [editColorInput, setEditColorInput]           = useState('')
  const [editColorHex, setEditColorHex]               = useState('#000000')
  const [showEditColorPicker, setShowEditColorPicker] = useState(false)

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

  useEffect(() => {
    if (!showColorPicker && !showEditColorPicker) return
    document.body.style.overflow = 'hidden'
    const handle = (e) => {
      if (e.key === 'Escape') { setShowColorPicker(false); setShowEditColorPicker(false) }
    }
    document.addEventListener('keydown', handle)
    return () => {
      document.removeEventListener('keydown', handle)
      document.body.style.overflow = ''
    }
  }, [showColorPicker, showEditColorPicker])

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
    // All files → upload directly; single file can be re-cropped via the Crop button on the preview
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
    setStagedFiles(prev => {
      if (!prev[color]) return prev
      prev[color].forEach(s => URL.revokeObjectURL(s.previewUrl))
      const n = { ...prev }; delete n[color]; return n
    })
    setColorEntries(prev => prev.filter(e => e.color !== color))
    setColorPreviews(prev => { const n = { ...prev }; delete n[color]; return n })
    setSizeInputs(prev => { const n = { ...prev }; delete n[color]; return n })
  }

  const startEditColor = (color) => {
    const found = [...NAMED_COLORS, ...customColors].find(c => c.name.toLowerCase() === color.toLowerCase())
    setEditColorInput(color)
    setEditColorHex(found?.hex ?? (/^#[0-9A-Fa-f]{6}$/i.test(color) ? color : '#888888'))
    setEditingColor(color)
    setShowEditColorPicker(false)
  }

  const cancelColorEdit = () => { setEditingColor(null); setShowEditColorPicker(false) }

  const saveColorEdit = (oldColor) => {
    const newName = editColorInput.trim()
    if (!newName) return
    setEditingColor(null)
    setShowEditColorPicker(false)
    if (newName === oldColor) return
    if (colorEntries.some(e => e.color.toLowerCase() === newName.toLowerCase() && e.color !== oldColor)) return
    setColorEntries(prev => prev.map(e => e.color === oldColor ? { ...e, color: newName } : e))
    setColorPreviews(prev => { const n = { ...prev }; if (oldColor in n) { n[newName] = n[oldColor]; delete n[oldColor] } return n })
    setSizeInputs(prev => { const n = { ...prev }; if (oldColor in n) { n[newName] = n[oldColor]; delete n[oldColor] } return n })
    setStagedFiles(prev => { const n = { ...prev }; if (oldColor in n) { n[newName] = n[oldColor]; delete n[oldColor] } return n })
    setExpandedSizes(prev => {
      const n = new Set()
      for (const key of prev) {
        n.add(key.startsWith(`${oldColor}::`) ? `${newName}::${key.slice(oldColor.length + 2)}` : key)
      }
      return n
    })
  }

  // ── Per-color images ────────────────────────────────────────────────────────
  const handleColorImageFiles = (color, files) => {
    const fileArr = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast(`"${file.name}" is not an image`, 'error'); return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast(`"${file.name}" exceeds 5 MB`, 'error'); return false
      }
      return true
    })
    if (!fileArr.length) return
    const existing = colorEntries.find(e => e.color === color)?.imageUrls?.length ?? 0
    const currentStaged = stagedFiles[color]?.length ?? 0
    const available = MAX_COLOR_IMAGES - existing - currentStaged
    if (available <= 0) { toast(`Maximum ${MAX_COLOR_IMAGES} images per color`, 'error'); return }
    const toAdd = fileArr.slice(0, available)
    if (toAdd.length < fileArr.length)
      toast(`Only ${toAdd.length} image${toAdd.length !== 1 ? 's' : ''} added — max ${MAX_COLOR_IMAGES} per color`, 'warning')
    const newStaged = toAdd.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setStagedFiles(prev => ({ ...prev, [color]: [...(prev[color] || []), ...newStaged] }))
  }

  const uploadStagedFiles = async (color) => {
    const staged = stagedFiles[color] || []
    if (!staged.length || uploadingColor) return
    setUploadingColor(color)
    try {
      const urls = await uploadImages(staged.map(s => s.file))
      setColorEntries(prev => prev.map(e =>
        e.color === color ? { ...e, imageUrls: [...new Set([...e.imageUrls, ...urls])] } : e
      ))
      setOriginalFiles(prev => {
        const n = new Map(prev)
        staged.forEach((s, i) => { if (urls[i]) n.set(urls[i], s.file) })
        return n
      })
      setStagedFiles(prev => {
        const n = { ...prev }
        ;(n[color] || []).forEach(s => URL.revokeObjectURL(s.previewUrl))
        delete n[color]
        return n
      })
    } catch {
      toast(t('common.error'), 'error')
    } finally {
      setUploadingColor(null)
    }
  }

  const removeStagedFile = (color, id) => {
    setStagedFiles(prev => {
      const current = prev[color] || []
      const item = current.find(s => s.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      const updated = current.filter(s => s.id !== id)
      if (!updated.length) { const n = { ...prev }; delete n[color]; return n }
      return { ...prev, [color]: updated }
    })
  }

  const handleCropStagedFile = (color, id) => {
    const item = (stagedFiles[color] || []).find(s => s.id === id)
    if (!item) return
    setCropSrc(item.previewUrl)
    setCropTarget({ type: 'color-staged', color, id })
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

  const removeColorImageWithConfirm = (color, idx) => {
    if (!window.confirm('Remove this image?')) return
    removeColorImage(color, idx)
  }

  const handleReplaceColorImage = async (color, idx, files) => {
    const file = Array.from(files)[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast(`"${file.name}" is not an image`, 'error'); return }
    if (file.size > 5 * 1024 * 1024) { toast(`"${file.name}" exceeds 5 MB`, 'error'); return }

    // Snapshot the URL being replaced before any state mutation
    const replaceUrl = colorEntries.find(e => e.color === color)?.imageUrls[idx]
    if (!replaceUrl) return

    // Optimistic update: show local blob URL immediately so the UI responds instantly
    const preview = URL.createObjectURL(file)
    setColorEntries(prev => prev.map(e => {
      if (e.color !== color) return e
      return {
        ...e,
        imageUrls: e.imageUrls.map(u => u === replaceUrl ? preview : u),
        primaryImageUrl: e.primaryImageUrl === replaceUrl ? preview : e.primaryImageUrl,
      }
    }))

    setUploadingColor(color)
    try {
      const urls = await uploadImages([file])
      if (!urls[0]) throw new Error('Upload returned no URL')

      // Settle: swap the temporary blob URL for the real S3 URL
      setColorEntries(prev => prev.map(e => {
        if (e.color !== color) return e
        return {
          ...e,
          imageUrls: e.imageUrls.map(u => u === preview ? urls[0] : u),
          primaryImageUrl: e.primaryImageUrl === preview ? urls[0] : e.primaryImageUrl,
        }
      }))
      setOriginalFiles(prev => {
        const n = new Map(prev)
        n.delete(replaceUrl)
        n.set(urls[0], file)
        return n
      })
      URL.revokeObjectURL(preview)
    } catch {
      // Rollback: restore original URL and notify the user
      setColorEntries(prev => prev.map(e => {
        if (e.color !== color) return e
        return {
          ...e,
          imageUrls: e.imageUrls.map(u => u === preview ? replaceUrl : u),
          primaryImageUrl: e.primaryImageUrl === preview ? replaceUrl : e.primaryImageUrl,
        }
      }))
      URL.revokeObjectURL(preview)
      toast(t('common.error'), 'error')
    } finally {
      setUploadingColor(null)
    }
  }

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
            ? value  // keep as raw string; parsed to int at submit time
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
      const { color, replaceUrl, cropBlobSrc } = target
      if (cropBlobSrc) URL.revokeObjectURL(cropBlobSrc)
      // Show instant preview while uploading
      setColorPreviews(prev => ({
        ...prev,
        [color]: [...(prev[color] || []), { file: croppedFile, previewUrl: preview }],
      }))
      setUploadingColor(color)
      try {
        const urls = await uploadImages([croppedFile])
        setColorEntries(prev =>
          prev.map(e => {
            if (e.color !== color) return e
            if (replaceUrl) {
              return {
                ...e,
                imageUrls: e.imageUrls.map(u => u === replaceUrl ? (urls[0] || u) : u),
                primaryImageUrl: e.primaryImageUrl === replaceUrl ? (urls[0] || e.primaryImageUrl) : e.primaryImageUrl,
              }
            }
            return { ...e, imageUrls: [...new Set([...e.imageUrls, ...urls])] }
          })
        )
        setOriginalFiles(prev => {
          const n = new Map(prev)
          if (replaceUrl) n.delete(replaceUrl)
          if (urls[0]) n.set(urls[0], croppedFile)
          return n
        })
      } finally {
        setUploadingColor(null)
        setColorPreviews(prev => ({
          ...prev,
          [color]: (prev[color] || []).filter(p => p.previewUrl !== preview),
        }))
        URL.revokeObjectURL(preview)
      }

    } else if (target?.type === 'color-staged') {
      const { color, id } = target
      setStagedFiles(prev => {
        const current = prev[color] || []
        const idx = current.findIndex(s => s.id === id)
        if (idx === -1) { URL.revokeObjectURL(preview); return prev }
        const old = current[idx]
        URL.revokeObjectURL(old.previewUrl)
        const updated = [...current]
        updated[idx] = { ...old, file: croppedFile, previewUrl: preview }
        return { ...prev, [color]: updated }
      })
    }
  }

  const handleCropCancel = () => {
    if (cropTarget?.cropBlobSrc) URL.revokeObjectURL(cropTarget.cropBlobSrc)
    setCropSrc(null)
    setCropTarget(null)
  }

  const handleCropButton = (url, color) => {
    const file = originalFiles.get(url)
    const blobSrc = file ? URL.createObjectURL(file) : null
    setCropSrc(blobSrc || url)
    setCropTarget({ type: 'color', color, replaceUrl: url, cropBlobSrc: blobSrc })
  }

  // ── Reset create form ──────────────────────────────────────────────────────
  const resetCreateForm = () => {
    const black = NAMED_COLORS.find(c => c.name.toLowerCase() === 'black')
    setForm({
      name: '', description: '', price: '', stockQuantity: 0,
      imageUrl: '', brand: '', size: '', color: '', material: '',
      isBestSeller: false, isNew: true, season: '', categoryId: presetCategoryId || '',
      discountType: '', discountValue: '', confirmedOrderCount: 0,
    })
    setMainImageFile(null)
    setMainImagePreview('')
    if (mainImageRef.current) mainImageRef.current.value = ''
    setGeneralImages([])
    setGeneralPreviews([])
    setColorEntries([])
    setColorPreviews({})
    setSizeInputs({})
    setExpandedSizes(new Set())
    setTouched({})
    setError('')
    setNewColorInput(black ? black.name : (NAMED_COLORS[0]?.name ?? ''))
    setNewColorHex(black ? black.hex : (NAMED_COLORS[0]?.hex ?? '#000000'))
    setShowColorPicker(false)
    setOriginalFiles(new Map())
    Object.values(stagedFiles).forEach(items => items.forEach(s => URL.revokeObjectURL(s.previewUrl)))
    setStagedFiles({})
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
        toast(t('admin.productAddedSuccess'))
        resetCreateForm()
        setSuccessMessage(t('admin.productAddedSuccess'))
        setTimeout(() => setSuccessMessage(''), 4000)
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
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1 text-sm font-semibold">{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

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
              {/* Color swatch button — opens fixed bottom-sheet picker */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(s => !s)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 shadow-sm cursor-pointer hover:border-[#6B1F2A] transition-colors"
                  style={{ backgroundColor: newColorHex }}
                  aria-label="Open color picker"
                  title="Pick a color"
                />
              </div>
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
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  {editingColor === color ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowEditColorPicker(s => !s)}
                        className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm cursor-pointer hover:border-[#6B1F2A] transition-colors shrink-0"
                        style={{ backgroundColor: editColorHex }}
                        aria-label="Open color picker"
                      />
                      <input
                        value={editColorInput}
                        onChange={e => {
                          setEditColorInput(e.target.value)
                          if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setEditColorHex(e.target.value)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); saveColorEdit(color) }
                          else if (e.key === 'Escape') cancelColorEdit()
                        }}
                        autoFocus
                        className="flex-1 min-w-0 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#6B1F2A]"
                        placeholder="Color name or #hex"
                      />
                      <button type="button" onClick={() => saveColorEdit(color)}
                        className="shrink-0 px-2.5 py-1 text-xs font-semibold bg-[#6B1F2A] text-white rounded-lg hover:bg-[#5A1923] transition-colors">
                        {t('admin.save')}
                      </button>
                      <button type="button" onClick={cancelColorEdit}
                        className="shrink-0 px-2.5 py-1 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                        {t('admin.cancel')}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-5 h-5 rounded-full border border-gray-300 shadow-sm shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-gray-800 truncate">{color}</span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {imageUrls.length} img · {sizes.length} size{sizes.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => startEditColor(color)}
                          className="text-[#6B1F2A] hover:text-[#5A1923] transition-colors text-sm font-medium">
                          {t('admin.edit')}
                        </button>
                        <button type="button" onClick={() => removeColorEntry(color)}
                          className="text-red-400 hover:text-red-600 transition-colors text-sm font-medium">
                          {t('admin.delete')}
                        </button>
                      </div>
                    </>
                  )}
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
                          <div key={i} className="flex flex-col items-center gap-1">
                            {/* Thumbnail */}
                            <div className={`relative w-20 h-20 rounded-xl overflow-hidden ${isMain ? 'border-2 border-[#6B1F2A] ring-1 ring-[#FDF0F2]' : 'border border-gray-200'}`}>
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              {isMain && (
                                <span className="absolute top-1 left-1 text-[9px] font-semibold uppercase tracking-wide bg-[#6B1F2A] text-white px-1.5 py-0.5 rounded-md shadow-sm z-10">
                                  ⭐ {t('admin.main') || 'Main'}
                                </span>
                              )}
                            </div>
                            {/* Always-visible action row */}
                            <div className="flex items-center gap-0.5">
                              <button type="button"
                                onClick={() => { setPreviewImages(imageUrls); setPreviewIndex(i) }}
                                title={t('admin.view') || 'View'}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button type="button"
                                onClick={() => setPrimaryColorImage(color, url)}
                                disabled={isMain}
                                title={isMain ? (t('admin.main') || 'Main') : (t('admin.setMain') || 'Set as main')}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isMain ? 'text-amber-400 cursor-default' : 'text-gray-400 hover:bg-amber-50 hover:text-amber-500'}`}>
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              </button>
                              <label htmlFor={`replace-${color}-${i}`}
                                title="Replace image"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B1F2A] hover:bg-[#FDF0F2] cursor-pointer transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </label>
                              <input id={`replace-${color}-${i}`} type="file" accept="image/*" className="sr-only"
                                onChange={e => { handleReplaceColorImage(color, i, e.target.files); e.target.value = '' }} />
                              <button type="button"
                                onClick={() => handleCropButton(url, color)}
                                title={t('admin.cropImage')}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4H8M16 4H20V8M4 16V20H8M20 16V20H16" />
                                </svg>
                              </button>
                              <button type="button"
                                onClick={() => removeColorImageWithConfirm(color, i)}
                                title={t('admin.delete') || 'Delete'}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            {/* Move buttons — only when there are multiple images */}
                            {imageUrls.length > 1 && (
                              <div className="flex items-center gap-0.5">
                                <button type="button" onClick={() => moveColorImage(color, i, -1)} disabled={i === 0}
                                  title={t('admin.moveLeft') || 'Move left'}
                                  className="w-7 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <button type="button" onClick={() => moveColorImage(color, i, +1)} disabled={i === imageUrls.length - 1}
                                  title={t('admin.moveRight') || 'Move right'}
                                  className="w-7 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {/* Staged thumbnails — selected but not yet uploaded */}
                      {(stagedFiles[color] || []).map(staged => (
                        <div key={staged.id} className="flex flex-col items-center gap-1">
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-[#6B1F2A]/50">
                            <img src={staged.previewUrl} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeStagedFile(color, staged.id)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div className="absolute bottom-0 inset-x-0 bg-[#6B1F2A]/70 text-white text-[7px] text-center py-[2px] font-semibold tracking-widest uppercase">
                              Pending
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCropStagedFile(color, staged.id)}
                            title={t('admin.cropImage')}
                            className="flex items-center gap-0.5 text-[10px] text-amber-600 hover:text-amber-800 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4H8M16 4H20V8M4 16V20H8M20 16V20H16" />
                            </svg>
                            Crop
                          </button>
                        </div>
                      ))}

                      {/* In-progress upload spinners (replace/crop flows) */}
                      {previews.map((p, i) => (
                        <div key={`cp-${i}`} className="flex flex-col items-center gap-1">
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                            <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                              <svg className="animate-spin w-4 h-4 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400">Uploading…</span>
                        </div>
                      ))}

                      <label htmlFor={`color-img-${color}`} className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#6B1F2A] transition-colors text-gray-400 hover:text-[#6B1F2A]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs mt-1">Add</span>
                      </label>
                      <input
                        id={`color-img-${color}`}
                        type="file"
                        multiple
                        accept="image/*"
                        className="sr-only"
                        onChange={e => { handleColorImageFiles(color, e.target.files); e.target.value = '' }}
                      />
                    </div>

                    {/* Upload staged button */}
                    {(stagedFiles[color] || []).length > 0 && (
                      <div className="mt-2.5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => uploadStagedFiles(color)}
                          disabled={!!uploadingColor}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#6B1F2A] rounded-xl hover:bg-[#5A1923] transition-colors disabled:opacity-50"
                        >
                          {uploadingColor === color ? (
                            <>
                              <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              Uploading…
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Upload {stagedFiles[color].length} image{stagedFiles[color].length !== 1 ? 's' : ''}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            ;(stagedFiles[color] || []).forEach(s => URL.revokeObjectURL(s.previewUrl))
                            setStagedFiles(prev => { const n = { ...prev }; delete n[color]; return n })
                          }}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Discard all
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-1.5">
                      {t('admin.multiImageHint') || 'Tap + to add · Select multiple images at once from your gallery'}
                    </p>
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
                              <input
                                type="number"
                                min="0"
                                value={s.stockQuantity ?? ''}
                                placeholder="0"
                                onChange={e => updateSizeField(color, s.size, 'stockQuantity', e.target.value)}
                                className="w-14 sm:w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:border-[#6B1F2A]"
                              />
                              <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">{t('admin.pieces')}</span>
                              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                                <button type="button" onClick={() => toggleSizeExpand(color, s.size)}
                                  className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                                    isExpanded || hasMeasurements
                                      ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                                  }`}>
                                  <svg className="w-3.5 h-3.5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 12h10M4 16h6" />
                                  </svg>
                                  <span className="hidden sm:inline">
                                    {hasMeasurements ? t('admin.measurementsSetLabel') : t('admin.measurementsLabel')}
                                  </span>
                                </button>
                                <button type="button" onClick={() => removeSizeFromColor(color, s.size)}
                                  className="text-red-400 hover:text-red-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-lg font-bold shrink-0 transition-colors">
                                  ×
                                </button>
                              </div>
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

      {/* Edit color picker — fixed bottom-sheet modal */}
      {showEditColorPicker && editingColor !== null && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
          onClick={() => setShowEditColorPicker(false)}
        >
          <div
            className="w-full sm:w-80 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(92vh, 520px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
              <div className="w-9 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-900 text-sm">{t('admin.editColor')}</h3>
              <button
                type="button"
                onClick={() => setShowEditColorPicker(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col items-center gap-4">
              <HexColorPicker
                color={editColorHex}
                onChange={hex => { setEditColorHex(hex); setEditColorInput(hex) }}
                style={{ width: '100%', maxWidth: '280px', height: 'min(240px, 60vw)' }}
              />
              <div className="w-full max-w-[280px] flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50">
                <div className="w-5 h-5 rounded-md border border-gray-200 shrink-0" style={{ backgroundColor: editColorHex }} />
                <span className="text-sm font-mono text-gray-400 select-none">#</span>
                <input
                  type="text"
                  value={editColorHex.replace('#', '').toUpperCase()}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
                    if (raw.length === 6) { setEditColorHex(`#${raw}`); setEditColorInput(`#${raw}`) }
                  }}
                  className="flex-1 text-sm font-mono uppercase bg-transparent focus:outline-none min-w-0"
                  maxLength={6}
                  placeholder="000000"
                />
              </div>
            </div>
            <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
              <button
                type="button"
                onClick={() => setShowEditColorPicker(false)}
                className="w-full py-3 bg-[#6B1F2A] text-white rounded-xl font-semibold text-sm hover:bg-[#5A1923] transition-colors min-h-[48px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color picker — fixed bottom-sheet modal (mobile) / centered dialog (desktop) */}
      {showColorPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
          onClick={() => setShowColorPicker(false)}
        >
          <div
            className="w-full sm:w-80 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(92vh, 520px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle (mobile only) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
              <div className="w-9 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-900 text-sm">Pick a Color</h3>
              <button
                type="button"
                onClick={() => setShowColorPicker(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col items-center gap-4">
              <HexColorPicker
                color={newColorHex}
                onChange={hex => { setNewColorHex(hex); setNewColorInput(hex) }}
                style={{ width: '100%', maxWidth: '280px', height: 'min(240px, 60vw)' }}
              />
              <div className="w-full max-w-[280px] flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50">
                <div className="w-5 h-5 rounded-md border border-gray-200 shrink-0" style={{ backgroundColor: newColorHex }} />
                <span className="text-sm font-mono text-gray-400 select-none">#</span>
                <input
                  type="text"
                  value={newColorHex.replace('#', '').toUpperCase()}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
                    if (raw.length === 6) { setNewColorHex(`#${raw}`); setNewColorInput(`#${raw}`) }
                  }}
                  className="flex-1 text-sm font-mono uppercase bg-transparent focus:outline-none min-w-0"
                  maxLength={6}
                  placeholder="000000"
                />
              </div>
            </div>

            {/* Sticky Done footer */}
            <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
              <button
                type="button"
                onClick={() => setShowColorPicker(false)}
                className="w-full py-3 bg-[#6B1F2A] text-white rounded-xl font-semibold text-sm hover:bg-[#5A1923] transition-colors min-h-[48px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
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
