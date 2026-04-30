import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminCategories, createCategory, updateCategory, deleteCategory, toggleCategoryVisibility } from '../../api/categoryApi'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import ImagePreviewModal from '../../components/ui/ImagePreviewModal'
import ImageCropModal from '../../components/ui/ImageCropModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/layout/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'

export default function AdminCategories() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '' })
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const fileInputRef = useRef(null)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [cropSrc, setCropSrc] = useState(null) // object URL of the source we're cropping
  const [togglingId, setTogglingId] = useState(null)

  const fetchCategories = () =>
    getAdminCategories().then(r => setCategories(r.data.data ?? [])).finally(() => setLoading(false))
  useEffect(() => { fetchCategories() }, [])

  const handleToggleVisibility = async (category) => {
    const id = category.id
    const previous = !!category.visible
    const optimistic = !previous
    // Optimistic UI update
    setCategories(prev => prev.map(c => c.id === id ? { ...c, visible: optimistic } : c))
    setTogglingId(id)
    try {
      const res = await toggleCategoryVisibility(id)
      const next = res?.data?.data?.visible ?? optimistic
      setCategories(prev => prev.map(c => c.id === id ? { ...c, visible: next } : c))
      toast(next ? t('admin.categoryNowVisible') : t('admin.categoryNowHidden'))
    } catch (err) {
      // Roll back on failure
      setCategories(prev => prev.map(c => c.id === id ? { ...c, visible: previous } : c))
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (!file) return
    // Open the same crop modal used by the product form, then discard the picker
    // value so the user can re-pick the same file again if they cancel.
    setCropSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleCropConfirm = (croppedFile) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    if (!croppedFile) return
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setImageFile(croppedFile)
    setPreviewUrl(URL.createObjectURL(croppedFile))
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      setSaving(true); setError('')
      const formData = new FormData()
      formData.append('name', form.name)
      if (form.description) formData.append('description', form.description)
      if (imageFile) formData.append('image', imageFile)

      const wasEdit = !!editingId
      if (wasEdit) await updateCategory(editingId, formData)
      else await createCategory(formData)

      resetForm()
      await fetchCategories()
      if (wasEdit) {
        toast(t('admin.updatedSuccess'))
      } else {
        toast(t('admin.categoryAddedSuccess'))
        setSuccessMessage(t('admin.categoryAddedSuccess'))
        setTimeout(() => setSuccessMessage(''), 4000)
      }
    } catch (err) {
      setError(err.response?.data?.message || t('admin.failedSave'))
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally { setSaving(false) }
  }

  const resetForm = () => {
    setForm({ name: '', description: '' })
    setImageFile(null)
    setPreviewUrl('')
    setEditingId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startEdit = c => {
    setEditingId(c.id)
    setForm({ name: c.name, description: c.description || '' })
    setImageFile(null)
    setPreviewUrl(c.imageUrl || '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const cancelEdit = () => resetForm()

  const handleDelete = async () => {
    if (!confirmTarget) return
    setDeleting(true)
    try {
      await deleteCategory(confirmTarget.id)
      setCategories(prev => prev.filter(c => c.id !== confirmTarget.id))
      setConfirmTarget(null)
      toast(t('admin.deletedSuccess'))
    } catch (err) {
      toast(err?.response?.data?.message || t('admin.failedDelete'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('admin.categories')}
        subtitle={t('admin.headerCategoriesSub')}
        icon="📂"
        color="#7B1E2B"
      />
      <div className="p-8 max-w-4xl pt-0 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editingId ? t('admin.editCategory') : t('admin.addCategory')}</h2>
          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('admin.name') + ' *'} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Input label={t('admin.description')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingId ? t('admin.replaceImage') : t('admin.image')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-3 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-gray-100 file:text-gray-700
                  hover:file:bg-gray-200 cursor-pointer"
              />
              {previewUrl && (
                <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover cursor-pointer"
                       onClick={() => setLightboxSrc(previewUrl)} />
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" loading={saving}>{editingId ? t('admin.update') : t('admin.addCategory')}</Button>
              {editingId && <Button type="button" variant="secondary" onClick={cancelEdit}>{t('admin.cancel')}</Button>}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{t('admin.allCategories')} ({categories?.length ?? 0})</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {categories.map(c => {
                const count = Number(c.productCount ?? 0)
                const countLabel = count === 0 ? t('admin.productCountZero')
                                 : count === 1 ? t('admin.productCountOne')
                                 : t('admin.productCount').replace('{count}', count)
                return (
                  <li key={c.id} className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {c.imageUrl ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover cursor-pointer"
                               onClick={() => setLightboxSrc(c.imageUrl)} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#FDF0F2] flex items-center justify-center shrink-0 text-sm font-bold" style={{ color: '#DFA3AD' }}>
                          {(c.name || '?').charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium text-sm truncate ${c.visible ? 'text-gray-900' : 'text-gray-500'}`}>{c.name}</p>
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border tabular-nums"
                            style={{
                              borderColor: count > 0 ? '#EDD8DC' : '#E5E7EB',
                              background:  count > 0 ? '#FDF0F2' : '#F9FAFB',
                              color:       count > 0 ? '#6B1F2A' : '#9CA3AF',
                            }}
                          >
                            {countLabel}
                          </span>
                          {!c.visible && (
                            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500">
                              {t('admin.categoryHidden')}
                            </span>
                          )}
                        </div>
                        {c.description && <p className="text-xs text-gray-400 truncate">{c.description}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {/* Visibility toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(c)}
                          disabled={togglingId === c.id}
                          title={c.visible ? t('admin.categoryVisible') : t('admin.categoryHidden')}
                          aria-label={c.visible ? t('admin.categoryVisible') : t('admin.categoryHidden')}
                          aria-pressed={!!c.visible}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                          style={c.visible
                            ? { background: '#ECFDF5', color: '#059669' }
                            : { background: '#F3F4F6', color: '#9CA3AF' }
                          }
                          onMouseEnter={e => e.currentTarget.style.background = c.visible ? '#D1FAE5' : '#E5E7EB'}
                          onMouseLeave={e => e.currentTarget.style.background = c.visible ? '#ECFDF5' : '#F3F4F6'}
                        >
                          {togglingId === c.id ? (
                            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : c.visible ? (
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
                        <Link
                          to={`/admin/products/new?category=${c.id}`}
                          title={t('admin.addProduct')}
                          aria-label={t('admin.addProduct')}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                          style={{ background: '#ECFDF5', color: '#059669' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#D1FAE5'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ECFDF5'}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </Link>
                        <Link
                          to={`/products?category=${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('admin.viewProducts')}
                          aria-label={t('admin.viewProducts')}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                          style={{ background: '#F5F3FF', color: '#7C3AED' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#EDE9FE'}
                          onMouseLeave={e => e.currentTarget.style.background = '#F5F3FF'}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => startEdit(c)}
                          title={t('admin.edit')}
                          aria-label={t('admin.edit')}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                          style={{ background: '#EFF6FF', color: '#3B82F6' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
                          onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmTarget(c)}
                          title={t('admin.delete')}
                          aria-label={t('admin.delete')}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                          style={{ background: '#FEF2F2', color: '#EF4444' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Image preview lightbox */}
      {lightboxSrc && (
        <ImagePreviewModal
          images={[lightboxSrc]}
          index={0}
          onClose={() => setLightboxSrc(null)}
          onChange={() => {}}
        />
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        itemName={confirmTarget?.name}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={1}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
