import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getRememberedEmail } from '../../utils/storage'
import Input from '../ui/Input'
import Button from '../ui/Button'

/**
 * Unified login + register form.
 *
 *  - One container, one heading, one form. The `mode` prop ('login' |
 *    'register') flips between the two field sets and submits to the
 *    appropriate AuthContext method.
 *  - Switching modes resets local state and re-fades the form via a `key`
 *    so the transition feels instant and clean.
 *  - All inputs have inline icons via the `icon` prop on the Input
 *    component (RTL-aware via `start-*` / `ps-*`).
 *  - Submit button uses the existing Button's built-in `loading` spinner.
 *  - Validation is shared: required fields apply to both modes; the email
 *    regex and password length only enforce on register so an existing user
 *    with an older/shorter password can still log in.
 *  - Calls `onSuccess()` after a successful login/register so the parent
 *    drawer can dismiss itself.
 *
 * Props:
 *   mode          'login' | 'register'
 *   onSwitchMode  (next) => void   — called when the bottom toggle is clicked
 *   onSuccess     ()    => void    — called after a successful submit
 */

const MailIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0119.5 19.5h-15a2.25 2.25 0 01-2.25-2.25V6.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M22.5 6.75l-10.5 7.5L1.5 6.75" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75M6.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const PhoneIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
)

const HomeIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12L11.204 3.045c.439-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
  </svg>
)

export default function AuthForms({ mode, onSwitchMode, onSuccess }) {
  const { login, register } = useAuth()
  const { t } = useLanguage()
  const isLogin = mode === 'login'

  const [form, setForm] = useState(() => ({
    firstName: '', lastName: '',
    email: mode === 'login' ? getRememberedEmail() : '',
    password: '', phone: '', address: '',
  }))
  const [errors, setErrors]       = useState({})
  const [apiError, setApiError]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  /* Reset all form state when the parent flips between login / register.
     On login mode, pre-fill the email if the user previously chose "Remember me". */
  useEffect(() => {
    setForm({
      firstName: '', lastName: '',
      email: mode === 'login' ? getRememberedEmail() : '',
      password: '', phone: '', address: '',
    })
    setErrors({})
    setApiError('')
    setRememberMe(false)
  }, [mode])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    setApiError('')
  }

  const validate = () => {
    const errs = {}
    if (!form.email.trim()) errs.email = t('auth.emailRequired')
    else if (!isLogin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('auth.emailInvalid')
    if (!form.password) errs.password = t('auth.passwordRequired')
    else if (!isLogin && form.password.length < 6) errs.password = t('auth.passwordMin')
    if (!isLogin) {
      if (!form.firstName.trim()) errs.firstName = t('auth.firstNameRequired')
      if (!form.lastName.trim())  errs.lastName  = t('auth.lastNameRequired')
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      setLoading(true)
      setApiError('')
      let userData
      if (isLogin) {
        userData = await login({ email: form.email, password: form.password }, rememberMe)
      } else {
        userData = await register(form)
      }
      if (onSuccess) onSuccess()
      // Admin lands directly in the admin panel; everyone else stays where they were.
      // Uses replace() so pressing Back from /admin doesn't re-open the login drawer.
      if (userData?.role === 'ADMIN' && typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
        window.location.replace('/admin')
      }
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
        (isLogin ? t('auth.loginFailed') : t('auth.registerFailed'))
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSwitch = () => {
    onSwitchMode?.(isLogin ? 'register' : 'login')
  }

  return (
    <div className="px-6 sm:px-9 py-10 sm:py-12">

      {/* ── Header — single source of truth for the title ───────── */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FDF0F2] to-[#F5DCE0] border border-[#F0D5D8] mb-4 shadow-sm">
          {isLogin ? <UserIcon /> : (
            <svg className="w-[20px] h-[20px] text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m7-7v14" />
            </svg>
          )}
        </div>

        <h1
          key={`title-${mode}`}
          className="text-3xl sm:text-[34px] font-light text-[#3D1A1E] mb-2 animate-fade-in"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          {isLogin ? t('auth.welcomeBack') : t('auth.joinUs')}
        </h1>

        <p
          key={`sub-${mode}`}
          className="text-sm text-[#9B7B80] tracking-wide animate-fade-in"
        >
          {isLogin ? t('auth.signInSub') : t('auth.joinUsToday')}
        </p>
      </div>

      {/* ── Form — re-keyed on mode for the slide/fade transition ─ */}
      <form
        key={`form-${mode}`}
        onSubmit={handleSubmit}
        className="space-y-4 animate-fade-in-up"
      >

        {/* Register-only: name fields */}
        {!isLogin && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              icon={<UserIcon />}
              name="firstName"
              placeholder={t('auth.firstName')}
              value={form.firstName}
              onChange={handleChange}
              error={errors.firstName}
              autoComplete="given-name"
            />
            <Input
              icon={<UserIcon />}
              name="lastName"
              placeholder={t('auth.lastName')}
              value={form.lastName}
              onChange={handleChange}
              error={errors.lastName}
              autoComplete="family-name"
            />
          </div>
        )}

        {/* Email */}
        <Input
          icon={<MailIcon />}
          type="email"
          name="email"
          placeholder={t('auth.emailAddress')}
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />

        {/* Password */}
        <Input
          icon={<LockIcon />}
          type="password"
          name="password"
          placeholder={t('auth.password')}
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />

        {/* Remember me — login only */}
        {isLogin && (
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <span className={[
              'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-150',
              rememberMe
                ? 'bg-[#6B1F2A] border-[#6B1F2A]'
                : 'bg-white border-[#DFA3AD] group-hover:border-[#9B7B80]',
            ].join(' ')}>
              {rememberMe && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
            />
            <span className="text-sm text-[#9B7B80] group-hover:text-[#6B1F2A] transition-colors">
              {t('auth.rememberMe')}
            </span>
          </label>
        )}

        {/* Register-only: optional phone + address */}
        {!isLogin && (
          <>
            <Input
              icon={<PhoneIcon />}
              type="tel"
              name="phone"
              placeholder={t('auth.phone')}
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
            <Input
              icon={<HomeIcon />}
              name="address"
              placeholder={t('auth.address')}
              value={form.address}
              onChange={handleChange}
              autoComplete="street-address"
            />
          </>
        )}

        {/* API error */}
        {apiError && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl px-4 py-3">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="leading-relaxed">{apiError}</span>
          </div>
        )}

        {/* Primary submit */}
        <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
          {isLogin ? t('auth.signIn') : t('auth.createAccount')}
        </Button>
      </form>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 my-7">
        <div className="flex-1 h-px bg-[#EDD8DC]" />
        <span className="text-[10px] tracking-widest text-[#DFA3AD] uppercase">{t('auth.or')}</span>
        <div className="flex-1 h-px bg-[#EDD8DC]" />
      </div>

      {/* ── Mode toggle (secondary action) ───────────────────────── */}
      <button
        type="button"
        onClick={handleSwitch}
        className="block w-full text-center text-sm text-[#9B7B80] hover:text-[#6B1F2A] transition-colors py-2 rounded-xl hover:bg-[#FDF0F2]/60"
      >
        {isLogin ? (
          <>
            {t('auth.noAccount')}{' '}
            <span className="font-semibold text-[#6B1F2A] underline underline-offset-4 decoration-[#DFA3AD]">
              {t('auth.registerLink')}
            </span>
          </>
        ) : (
          <>
            {t('auth.haveAccount')}{' '}
            <span className="font-semibold text-[#6B1F2A] underline underline-offset-4 decoration-[#DFA3AD]">
              {t('auth.signInLink')}
            </span>
          </>
        )}
      </button>
    </div>
  )
}
