import { useEffect, useRef, useState } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categoryApi'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import ImagePreviewModal from '../../components/ui/ImagePreviewModal'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminCategories() {
  const { t } = useLanguage()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '' })
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const [lightboxSrc, setLightboxSrc] = useState(null)

  const fetchCategories = () =>
    getCategories().then(r => setCategories(r.data.data ?? [])).finally(() => setLoading(false))
  useEffect(() => { fetchCategories() }, [])

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      setSaving(true); setError('')
      const formData = new FormData()
      formData.append('name', form.name)
      if (form.description) formData.append('description', form.description)
      if (imageFile) formData.append('image', imageFile)

      if (editingId) await updateCategory(editingId, formData)
      else await createCategory(formData)

      resetForm()
      await fetchCategories()
    } catch (err) {
      setError(err.response?.data?.message || t('admin.failedSave'))
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

  const handleDelete = async id => {
    if (!confirm(t('admin.deleteCategory'))) return
    try {
      await deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      alert(t('admin.failedDelete'))
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('admin.categories')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editingId ? t('admin.editCategory') : t('admin.addCategory')}</h2>
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
              {categories.map(c => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                  {c.imageUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover cursor-pointer"
                           onClick={() => setLightboxSrc(c.imageUrl)} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                    {c.description && <p className="text-xs text-gray-400 truncate">{c.description}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(c)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">{t('admin.edit')}</button>
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">{t('admin.delete')}</button>
                  </div>
                </li>
              ))}
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
    </div>
  )
}
