import { useEffect } from 'react'
import { useUI } from '../../context/UIContext'
import { useLanguage } from '../../context/LanguageContext'
import AuthForms from './AuthForms'

/**
 * Slide-in / full-screen authentication panel.
 *
 *  - Desktop (md+): rendered as a fixed-width drawer (440 px) that slides in
 *    from the **right** in RTL (Arabic) and from the **left** in LTR
 *    (English). The rest of the page stays visible behind a dim overlay.
 *  - Mobile (< md): rendered as a full-screen modal (no rounded corners,
 *    panel takes 100% of the viewport).
 *
 * The drawer is just chrome — close button, backdrop, ESC handling, scroll
 * lock. The form, header, and switch toggle all live inside <AuthForms />,
 * which is the single source of truth for the auth UI. No duplicate titles.
 */
export default function AuthDrawer() {
  const { authDrawer, closeAuth, openLogin, openRegister } = useUI()
  const { isRTL, t } = useLanguage()
  const { open, mode } = authDrawer

  /* ESC closes */
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') closeAuth() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeAuth])

  /* Lock body scroll while drawer is open */
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  /* RTL → drawer comes from the right; LTR → from the left.
     Rounded corner is on the inner edge (the side facing the page). */
  const sideAnchor   = isRTL ? 'right-0' : 'left-0'
  const slideAnim    = isRTL ? 'animate-drawer-right' : 'animate-drawer-left'
  const innerRounded = isRTL ? 'md:rounded-l-3xl' : 'md:rounded-r-3xl'

  const handleSwitch = (next) => {
    if (next === 'register') openRegister()
    else openLogin()
  }

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
    >
      {/* Dim backdrop — click to close */}
      <div
        onClick={closeAuth}
        className="absolute inset-0 bg-[#3D1A1E]/45 backdrop-blur-sm animate-fade-in"
      />

      {/* Sliding panel */}
      <div
        className={[
          'absolute inset-y-0',
          sideAnchor,
          'w-full md:w-[440px]',
          'bg-[#FDF6F7]',
          'shadow-[0_10px_60px_rgba(107,31,42,0.25)]',
          innerRounded,
          'flex flex-col overflow-hidden',
          slideAnim,
        ].join(' ')}
      >
        {/* Close button — floating, top-end (no header bar, no duplicate title) */}
        <button
          type="button"
          onClick={closeAuth}
          aria-label={t('common.close')}
          className="absolute top-4 end-4 z-10 w-9 h-9 rounded-full bg-white/85 hover:bg-white backdrop-blur-sm border border-[#F0D5D8] flex items-center justify-center text-[#9B7B80] hover:text-[#6B1F2A] transition-all duration-200 active:scale-95 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable form area — AuthForms owns the entire UI */}
        <div className="flex-1 overflow-y-auto">
          <AuthForms
            mode={mode}
            onSwitchMode={handleSwitch}
            onSuccess={closeAuth}
          />
        </div>
      </div>
    </div>
  )
}
