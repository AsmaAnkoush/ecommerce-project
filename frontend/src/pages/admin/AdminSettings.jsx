import { useEffect, useRef, useState } from 'react'
import { getSettings, updateSettings, updateActiveSeason, uploadLogo } from '../../api/adminApi'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const SEASON_CONFIG = {
  SUMMER: {
    label: 'Summer',
    icon: '☀️',
    description: 'Show summer collection on homepage',
    colors: 'bg-amber-50 border-amber-200 text-amber-800',
    active: 'bg-amber-500 text-white',
  },
  WINTER: {
    label: 'Winter',
    icon: '❄️',
    description: 'Show winter collection on homepage',
    colors: 'bg-blue-50 border-blue-200 text-blue-800',
    active: 'bg-blue-600 text-white',
  },
}

export default function AdminSettings() {
  const [form, setForm] = useState({ siteName: '', logoUrl: '', contactEmail: '', contactPhone: '', contactWhatsApp: '', description: '', address: '' })
  const [activeSeason, setActiveSeason] = useState('SUMMER')
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)  // blob URL for instant preview
  const [seasonSaving, setSeasonSaving] = useState(false)
  const [success, setSuccess]         = useState(false)
  const [seasonSuccess, setSeasonSuccess] = useState(false)
  const [error, setError]             = useState('')
  const logoInputRef = useRef(null)

  useEffect(() => {
    getSettings().then(res => {
      const s = res.data.data
      setForm({ siteName: s.siteName || '', logoUrl: s.logoUrl || '', contactEmail: s.contactEmail || '',
        contactPhone: s.contactPhone || '', contactWhatsApp: s.contactWhatsApp || '',
        description: s.description || '', address: s.address || '' })
      setActiveSeason(s.activeSeason || 'SUMMER')
    }).finally(() => setLoading(false))
  }, [])

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setLogoPreview(preview)
    setLogoUploading(true)
    setError('')
    try {
      const res = await uploadLogo(file)
      const newLogoUrl = res.data?.data?.logoUrl || ''
      setForm(f => ({ ...f, logoUrl: newLogoUrl }))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload logo')
      setLogoPreview(null)
    } finally {
      setLogoUploading(false)
      URL.revokeObjectURL(preview)
      setLogoPreview(null)
      e.target.value = ''
    }
  }

  const handleSeasonChange = async (season) => {
    if (season === activeSeason) return
    try {
      setSeasonSaving(true)
      await updateActiveSeason(season)
      setActiveSeason(season)
      setSeasonSuccess(true)
      setTimeout(() => setSeasonSuccess(false), 2500)
    } catch {
      setError('Failed to update season')
    } finally { setSeasonSaving(false) }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      setSaving(true); setError('')
      await updateSettings(form)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-40"><Spinner size="lg" /></div>

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Website Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">General</h2>
          <Input label="Website Name" value={form.siteName} onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))} />

          {/* ── Logo Upload ── */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Logo</label>
            <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleLogoUpload} />

            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {logoUploading ? (
                  <Spinner size="sm" />
                ) : (logoPreview || form.logoUrl) ? (
                  <img src={logoPreview || form.logoUrl} alt="Logo preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* Upload button + info */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {logoUploading ? 'Uploading…' : form.logoUrl ? 'Replace Logo' : 'Upload Logo'}
                </button>
                {form.logoUrl && !logoUploading && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
                    className="block text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remove logo
                  </button>
                )}
                <p className="text-xs text-gray-400">JPEG, PNG, WEBP · max 5 MB</p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black" />
          </div>
          <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Contact Info</h2>
          <Input label="Email" type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
          <Input label="Phone" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
          <Input label="WhatsApp Number" value={form.contactWhatsApp} onChange={e => setForm(f => ({ ...f, contactWhatsApp: e.target.value }))} placeholder="+1234567890" />
          <p className="text-xs text-gray-400">WhatsApp number is used to contact customers about their orders.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">Settings saved successfully!</div>}

        <Button type="submit" size="lg" loading={saving}>Save Settings</Button>
      </form>

      {/* ── Season Control ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 mt-6">
        <div>
          <h2 className="font-semibold text-gray-900">Active Season</h2>
          <p className="text-xs text-gray-400 mt-0.5">Controls which seasonal collection is featured on the homepage. Changes apply immediately.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(SEASON_CONFIG).map(([key, cfg]) => {
            const isActive = activeSeason === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSeasonChange(key)}
                disabled={seasonSaving}
                className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 disabled:opacity-60 ${
                  isActive
                    ? 'border-gray-900 bg-gray-900 text-white shadow-lg scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-400 bg-white text-gray-700'
                }`}
              >
                <span className="text-3xl">{cfg.icon}</span>
                <span className="font-semibold text-sm tracking-wide">{cfg.label}</span>
                <span className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{cfg.description}</span>
                {isActive && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-green-400" title="Active" />
                )}
              </button>
            )
          })}
        </div>

        {seasonSaving && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Spinner size="sm" /><span>Updating season…</span>
          </div>
        )}
        {seasonSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
            Active season updated successfully!
          </div>
        )}
      </div>
    </div>
  )
}
