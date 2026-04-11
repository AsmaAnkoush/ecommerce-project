import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getProfile, updateProfile } from '../api/userApi'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [form, setForm]     = useState({ firstName: '', lastName: '', phone: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    getProfile()
      .then((res) => {
        const u = res.data.data
        setForm({ firstName: u.firstName, lastName: u.lastName, phone: u.phone || '', address: u.address || '' })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      await updateProfile(form)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || t('profile.failedUpdate'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-light text-[#3D1A1E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t('profile.title')}
        </h1>
        <div className="h-0.5 w-12 mt-2" style={{ background: 'linear-gradient(90deg, #DFA3AD, transparent)' }} />
      </div>

      {/* User card */}
      <div
        className="bg-white rounded-3xl p-6 mb-5 flex items-center gap-5"
        style={{ boxShadow: '0 2px 20px rgba(107,31,42,0.07)', border: '1px solid #F5E0E3' }}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-light select-none"
            style={{
              background: 'linear-gradient(135deg, #6B1F2A 0%, #9B3545 100%)',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '22px',
              boxShadow: '0 4px 16px rgba(107,31,42,0.28)',
            }}
          >
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#3D1A1E] text-base truncate">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-[#9B7B80] truncate mt-0.5">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-[10px] bg-[#FDF0F2] text-[#6B1F2A] px-2.5 py-0.5 rounded-full font-semibold border border-[#EDD8DC] tracking-wide uppercase">
              {user?.role === 'ADMIN' ? '👑 ' + t('profile.admin') : '✦ ' + t('profile.member')}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div
        className="bg-white rounded-3xl p-6 sm:p-8"
        style={{ boxShadow: '0 2px 20px rgba(107,31,42,0.07)', border: '1px solid #F5E0E3' }}
      >
        <h2 className="text-xl font-light text-[#3D1A1E] mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t('profile.editProfile')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('profile.firstName')} name="firstName" value={form.firstName} onChange={handleChange} required />
            <Input label={t('profile.lastName')}  name="lastName"  value={form.lastName}  onChange={handleChange} required />
          </div>
          <Input label={t('profile.phone')} type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder={t('profile.phonePlaceholder')} />
          <Input label={t('profile.address')} name="address" value={form.address} onChange={handleChange} placeholder={t('profile.addressPlaceholder')} />

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              {t('profile.updated')}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[#F9E8EB]">
            <Button type="submit" loading={saving}>
              {t('profile.saveChanges')}
            </Button>
            <button
              type="button"
              onClick={logout}
              className="text-xs text-[#9B7B80] hover:text-red-500 transition-colors tracking-wide flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('profile.signOut')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
