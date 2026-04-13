import { useEffect, useRef, useState } from 'react'
import { getSettings, updateSettings, updateActiveSeason, uploadLogo } from '../../api/adminApi'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import PageHeader from '../../components/layout/PageHeader'
import ImageCropModal from '../../components/ui/ImageCropModal'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'

function getSeasonConfig(t) {
  return {
    SUMMER: { label: t('admin.summerLabel'), icon: '☀️', description: t('admin.summerDesc') },
    WINTER: { label: t('admin.winterLabel'), icon: '❄️', description: t('admin.winterDesc') },
  }
}

/* ── Section card ───────────────────────────────────────────────────────── */
function SectionCard({ icon, title, hint, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <header className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="text-xl leading-none" aria-hidden="true">{icon}</span>
          <span>{title}</span>
        </h2>
        {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  )
}

/* ── Field row (label + input) ──────────────────────────────────────────── */
function Field({ label, hint, error, full, children }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
      {error && <p className="text-xs text-amber-600 mt-1.5">{error}</p>}
    </div>
  )
}

export default function AdminSettings() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { refresh: refreshSiteSettings } = useSiteSettings()
  const SEASON_CONFIG = getSeasonConfig(t)

  const [form, setForm] = useState({
    siteName: '', logoUrl: '', contactEmail: '', contactPhone: '', contactWhatsApp: '',
    description: '', address: '',
  })
  const [activeSeason, setActiveSeason] = useState('SUMMER')
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [seasonSaving, setSeasonSaving] = useState(false)
  const [cropSrc, setCropSrc]           = useState(null)
  const logoInputRef = useRef(null)

  const whatsappDigits  = (form.contactWhatsApp || '').replace(/\D/g, '')
  const whatsappValid   = whatsappDigits.length >= 9 && whatsappDigits.length <= 15
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

  /* ── Logo: pick → crop → upload ── */
  const handleLogoPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleCropConfirm = async (croppedFile) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    if (!croppedFile) return
    setLogoUploading(true)
    try {
      const res = await uploadLogo(croppedFile)
      const newLogoUrl = res.data?.data?.logoUrl || ''
      setForm(f => ({ ...f, logoUrl: newLogoUrl }))
      await refreshSiteSettings()
      toast(t('admin.toastUpdated'))
    } catch (err) {
      toast(err.response?.data?.message || t('admin.failedUploadLogo'), 'error')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const handleSeasonChange = async (season) => {
    if (season === activeSeason || seasonSaving) return
    setSeasonSaving(true)
    try {
      await updateActiveSeason(season)
      setActiveSeason(season)
      await refreshSiteSettings()
      toast(t('admin.seasonUpdated'))
    } catch (err) {
      toast(err?.response?.data?.message || t('admin.failedUpdateSeason'), 'error')
    } finally { setSeasonSaving(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!form.contactWhatsApp || !whatsappValid) {
      toast(t('admin.whatsAppInvalid'), 'error')
      return
    }
    setSaving(true)
    try {
      await updateSettings(form)
      await refreshSiteSettings()
      toast(t('admin.settingsSaved'))
    } catch (err) {
      toast(err?.response?.data?.message || t('admin.failedUpdateSettings'), 'error')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-40"><Spinner size="lg" /></div>

  return (
    <div>
      <PageHeader
        title={t('admin.websiteSettings')}
        subtitle={t('admin.settingsHint')}
        icon="⚙️"
        color="#7B1E2B"
      />

      {/* pb leaves room for the sticky save bar */}
      <div className="p-5 lg:p-8 max-w-4xl pt-0 pb-32">
        <form onSubmit={handleSubmit} noValidate>

          {/* ── 🏪 Store Information ── */}
          <SectionCard icon="🏪" title={t('admin.storeInfo')}>
            <Field label={t('admin.storeName')}>
              <Input
                value={form.siteName}
                onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))}
                placeholder={t('admin.storeNamePlaceholder')}
              />
            </Field>
            <Field label={t('admin.storeAddress')}>
              <Input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder={t('admin.storeAddressPlaceholder')}
              />
            </Field>
            <Field label={t('admin.storeDescription')} full>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder={t('admin.storeDescriptionPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
              />
            </Field>
          </SectionCard>

          {/* ── 📞 Contact Information ── */}
          <SectionCard icon="📞" title={t('admin.contactInfo')}>
            {/* WhatsApp — full width, marked priority */}
            <Field
              full
              label={
                <span className="inline-flex items-center gap-1.5">
                  {t('admin.whatsAppNumber')}
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {t('admin.required')}
                  </span>
                </span>
              }
              hint={t('admin.whatsAppHelper')}
              error={form.contactWhatsApp && !whatsappValid ? t('admin.whatsAppInvalid') : null}
            >
              <div className="flex gap-2">
                <Input
                  value={form.contactWhatsApp}
                  onChange={e => setForm(f => ({ ...f, contactWhatsApp: e.target.value }))}
                  placeholder="+970 5XX XXX XXX"
                  className="flex-1"
                  dir="ltr"
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
                  title={t('admin.testWhatsApp')}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-9 9M19 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h6" />
                  </svg>
                  {t('admin.testWhatsApp')}
                </a>
              </div>
            </Field>

            <Field label={t('admin.phoneNumber')}>
              <Input
                value={form.contactPhone}
                onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                placeholder="+970 XX XXX XXXX"
                dir="ltr"
              />
            </Field>
            <Field label={t('admin.emailAddress')}>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                placeholder="info@example.com"
                dir="ltr"
              />
            </Field>
          </SectionCard>

          {/* ── 🚚 Delivery & Policies ── */}
          <SectionCard
            icon="🚚"
            title={t('admin.deliveryAndPolicies')}
            hint={t('admin.deliveryFixedHint')}
          >
            <div className="md:col-span-2 bg-[#FDF6F7] border border-[#F0D5D8] rounded-xl p-4">
              <p className="text-sm font-semibold text-[#3D1A1E] mb-3 flex items-center gap-1.5">
                <span aria-hidden="true">📦</span>{t('admin.deliveryPrices')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                {[
                  { zone: t('shipping.westBank'), price: 20 },
                  { zone: t('shipping.jerusalem'), price: 30 },
                  { zone: t('shipping.inside48'),  price: 70 },
                ].map(z => (
                  <div key={z.zone} className="flex items-center justify-between bg-white border border-[#F0D5D8] rounded-lg px-3 py-2 text-sm">
                    <span className="text-[#6B4E53]">{z.zone}</span>
                    <span className="font-bold text-[#6B1F2A] tabular-nums">{z.price} ₪</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#F0D5D8] pt-3">
                <p className="text-xs font-semibold text-[#3D1A1E] mb-1">{t('admin.exchangePolicyTitle')}</p>
                <p className="text-xs text-[#6B4E53] leading-relaxed">{t('checkout.exchangePolicy')}</p>
              </div>
            </div>
          </SectionCard>

          {/* ── 🖼 Branding ── */}
          <SectionCard icon="🖼️" title={t('admin.branding')} hint={t('admin.brandingHint')}>
            <div className="md:col-span-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleLogoPick}
              />
              <div className="flex items-center gap-5">
                <div className="w-24 h-24 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                  {logoUploading ? (
                    <Spinner size="sm" />
                  ) : form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {logoUploading ? t('admin.uploading') : form.logoUrl ? t('admin.replaceLogo') : t('admin.uploadLogo')}
                    </button>
                    {form.logoUrl && !logoUploading && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
                        className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors px-2 py-1"
                      >
                        {t('admin.removeLogo')}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{t('admin.logoFormats')}</p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── ⚙️ Active Season ── */}
          <SectionCard icon="🗓️" title={t('admin.activeSeason')} hint={t('admin.activeSeasonDesc')}>
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
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
                    <span className="text-3xl" aria-hidden="true">{cfg.icon}</span>
                    <span className="font-semibold text-sm tracking-wide">{cfg.label}</span>
                    <span className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{cfg.description}</span>
                    {isActive && <span className="absolute top-2.5 end-2.5 w-2 h-2 rounded-full bg-emerald-400" title="Active" />}
                  </button>
                )
              })}
            </div>
            {seasonSaving && (
              <div className="md:col-span-2 flex items-center gap-2 text-sm text-gray-500">
                <Spinner size="sm" /><span>{t('admin.updatingSeason')}</span>
              </div>
            )}
          </SectionCard>
        </form>
      </div>

      {/* ── Sticky save bar ── */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto px-5 lg:px-8 py-3 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#6B1F2A] hover:bg-[#5A1822] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md w-full sm:w-auto"
          >
            {saving && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saving ? t('admin.saving') : t('admin.saveSettings')}
          </button>
        </div>
      </div>

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
