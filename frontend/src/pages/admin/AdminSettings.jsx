import { useEffect, useRef, useState } from 'react'
import { getSettings, updateSettings, updateActiveSeason, uploadLogo } from '../../api/adminApi'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import PageHeader from '../../components/layout/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'

function getSeasonConfig(t) {
  return {
    SUMMER: { label: t('admin.summerLabel'), icon: '☀️', description: t('admin.summerDesc') },
    WINTER: { label: t('admin.winterLabel'), icon: '❄️', description: t('admin.winterDesc') },
  }
}

function SectionCard({ icon, title, hint, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-[#F5EDEF] p-6 space-y-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none shrink-0" aria-hidden="true">{icon}</span>
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
          {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export default function AdminSettings() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { refresh: refreshSiteSettings } = useSiteSettings()
  const SEASON_CONFIG = getSeasonConfig(t)
  const [form, setForm] = useState({ siteName: '', logoUrl: '', contactEmail: '', contactPhone: '', contactWhatsApp: '', description: '', address: '' })
  const [activeSeason, setActiveSeason] = useState('SUMMER')
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [seasonSaving, setSeasonSaving] = useState(false)
  const [error, setError]             = useState('')
  const logoInputRef = useRef(null)

  const whatsappDigits = (form.contactWhatsApp || '').replace(/\D/g, '')
  const whatsappValid  = whatsappDigits.length >= 9 && whatsappDigits.length <= 15
  const whatsappTestUrl = whatsappValid ? `https://wa.me/${whatsappDigits}` : null

  useEffect(() => {
    getSettings().then(res => {
      const s = res.data.data
      setForm({
        siteName: s.siteName || '', logoUrl: s.logoUrl || '', contactEmail: s.contactEmail || '',
        contactPhone: s.contactPhone || '', contactWhatsApp: s.contactWhatsApp || '',
        description: s.description || '', address: s.address || '',
      })
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
      setError(err.response?.data?.message || t('admin.failedUploadLogo'))
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
      await refreshSiteSettings()
      toast(t('admin.seasonUpdated'))
    } catch {
      setError(t('admin.failedUpdateSeason'))
    } finally { setSeasonSaving(false) }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      setSaving(true); setError('')
      await updateSettings(form)
      await refreshSiteSettings()
      toast(t('admin.settingsSaved'))
    } catch (err) {
      setError(err.response?.data?.message || t('admin.failedUpdateSettings'))
      toast(err?.response?.data?.message || t('admin.failedUpdateSettings'), 'error')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-40"><Spinner size="lg" /></div>

  return (
    <div>
      <PageHeader
        title={t('admin.websiteSettings')}
        subtitle={t('admin.settingsHint') || 'Manage your storefront configuration in one place.'}
        icon="⚙️"
        color="#7B1E2B"
      />
      <div className="p-5 lg:p-8 max-w-3xl pt-0">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Store Information ── */}
        <SectionCard icon="🏪" title={t('admin.general')}>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('admin.websiteName')}</label>
            <Input value={form.siteName} onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">{t('admin.logo')}</label>
            <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleLogoUpload} />
            <div className="flex items-center gap-4">
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
              <div className="space-y-1.5">
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={logoUploading}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50">
                  {logoUploading ? t('admin.uploading') : form.logoUrl ? t('admin.replaceLogo') : t('admin.uploadLogo')}
                </button>
                {form.logoUrl && !logoUploading && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
                    className="block text-xs text-red-500 hover:text-red-700 transition-colors">
                    {t('admin.removeLogo')}
                  </button>
                )}
                <p className="text-xs text-gray-400">{t('admin.logoFormats')}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('admin.description')}</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('profile.address')}</label>
            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
        </SectionCard>

        {/* ── Contact Settings ── */}
        <SectionCard icon="📞" title={t('admin.contactInfo')}>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('admin.email')}</label>
            <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('admin.phone')}</label>
            <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              {t('admin.whatsAppNumber')} <span className="text-emerald-600">★</span>
            </label>
            <div className="flex gap-2">
              <Input
                value={form.contactWhatsApp}
                onChange={e => setForm(f => ({ ...f, contactWhatsApp: e.target.value }))}
                placeholder="+1234567890"
                className="flex-1"
              />
              <a
                href={whatsappTestUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => { if (!whatsappTestUrl) e.preventDefault() }}
                className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 rounded-lg transition-colors ${
                  whatsappTestUrl
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={t('admin.testWhatsApp') || 'Test WhatsApp link'}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-9 9M19 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h6" />
                </svg>
                {t('admin.testWhatsApp') || 'Test'}
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              {t('admin.whatsAppGlobalHint') || 'This number is used across the entire website (orders, contact buttons, footer, floating chat).'}
            </p>
            {form.contactWhatsApp && !whatsappValid && (
              <p className="text-xs text-amber-600 mt-1">
                {t('admin.whatsAppInvalid') || 'Enter a valid international number (9–15 digits, optional +).'}
              </p>
            )}
          </div>
        </SectionCard>

        {/* ── Delivery Settings ── */}
        <SectionCard
          icon="🚚"
          title={t('admin.deliverySettings') || 'Delivery Settings'}
          hint={t('admin.deliveryHint') || 'Delivery zones, prices, and the exchange policy are fixed in the storefront. Edit them in the Delivery page if you need to change values.'}
        >
          <div className="bg-[#FDF6F7] border border-[#F0D5D8] rounded-xl p-4 text-xs text-[#6B4E53] leading-relaxed">
            <p className="font-medium text-[#3D1A1E] mb-1">📦 {t('admin.deliveryFixed') || 'Delivery is configured statically'}</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>{t('shipping.westBank')} — 20</li>
              <li>{t('shipping.jerusalem')} — 30</li>
              <li>{t('shipping.inside48')} — 70</li>
              <li>{t('checkout.exchangePolicy')}</li>
            </ul>
          </div>
        </SectionCard>

        {/* ── General / Season ── */}
        <SectionCard icon="⚙️" title={t('admin.activeSeason')} hint={t('admin.activeSeasonDesc')}>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(SEASON_CONFIG).map(([key, cfg]) => {
              const isActive = activeSeason === key
              return (
                <button key={key} type="button" onClick={() => handleSeasonChange(key)} disabled={seasonSaving}
                  className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 disabled:opacity-60 ${
                    isActive
                      ? 'border-gray-900 bg-gray-900 text-white shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-gray-400 bg-white text-gray-700'
                  }`}>
                  <span className="text-3xl">{cfg.icon}</span>
                  <span className="font-semibold text-sm tracking-wide">{cfg.label}</span>
                  <span className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{cfg.description}</span>
                  {isActive && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-green-400" title="Active" />}
                </button>
              )
            })}
          </div>
          {seasonSaving && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              <Spinner size="sm" /><span>{t('admin.updatingSeason')}</span>
            </div>
          )}
        </SectionCard>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {/* Inline save action — no longer overlapping content */}
        <div className="flex flex-col items-end gap-2 pt-2">
          <Button type="submit" size="lg" loading={saving}>
            {t('admin.saveSettings')}
          </Button>
          <p className="text-xs text-gray-400 mt-2">{t('admin.unsavedHint') || 'Changes apply across the storefront once saved.'}</p>
        </div>
      </form>
      </div>
    </div>
  )
}
