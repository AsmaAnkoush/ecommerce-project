import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { useLanguage } from '../../context/LanguageContext'
import { useUI } from '../../context/UIContext'
import LanguageToggle from '../ui/LanguageToggle'
import CartIcon from '../ui/CartIcon'

const FloralDot = () => (
  <svg width="36" height="12" viewBox="0 0 36 12" fill="none">
    <path d="M18 4 Q16 1.5 14 4 Q16 6.5 18 4Z" fill="#E8BDC4" opacity="0.9"/>
    <path d="M18 4 Q20 1.5 22 4 Q20 6.5 18 4Z" fill="#E8BDC4" opacity="0.9"/>
    <path d="M18 8 Q16 10.5 14 8 Q16 5.5 18 8Z" fill="#E8BDC4" opacity="0.9"/>
    <path d="M18 8 Q20 10.5 22 8 Q20 5.5 18 8Z" fill="#E8BDC4" opacity="0.9"/>
    <path d="M14 6 Q11 4.5 12 6 Q11 7.5 14 6Z" fill="#E8BDC4" opacity="0.6"/>
    <path d="M22 6 Q25 4.5 24 6 Q25 7.5 22 6Z" fill="#E8BDC4" opacity="0.6"/>
    <circle cx="18" cy="6" r="2" fill="#DFA3AD" opacity="0.95"/>
    <circle cx="8"  cy="6" r="1.2" fill="#E8BDC4" opacity="0.45"/>
    <circle cx="28" cy="6" r="1.2" fill="#E8BDC4" opacity="0.45"/>
    <circle cx="3"  cy="6" r="0.7" fill="#E8BDC4" opacity="0.28"/>
    <circle cx="33" cy="6" r="0.7" fill="#E8BDC4" opacity="0.28"/>
  </svg>
)

export default function Navbar() {
  const { user, logout, isLoggedIn, isAdmin } = useAuth()
  const { cart }     = useCart()
  const navigate     = useNavigate()
  const { t } = useLanguage()
  const { openLogin, openRegister, openCart, openSearch } = useUI()

  const { siteName, logoUrl } = useSiteSettings()

  const [menuOpen,     setMenuOpen]     = useState(false)
  const [scrolled,     setScrolled]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  // Close user dropdown when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  /* Cart bump animation: triggers a one-shot heartbeat whenever totalItems
     increases. Uses a key to force-remount the icon so the animation can
     replay on every add. The first effect run is skipped so the initial
     async cart load (e.g. server fetch on login) doesn't bump. */
  const [cartBumpKey, setCartBumpKey] = useState(0)
  const prevItemsRef = useRef(null)
  useEffect(() => {
    const current = cart?.totalItems || 0
    if (prevItemsRef.current === null) {
      prevItemsRef.current = current
      return
    }
    const prev = prevItemsRef.current
    prevItemsRef.current = current
    if (current > prev) setCartBumpKey(k => k + 1)
  }, [cart?.totalItems])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Lock body scroll while mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  /* Escape key closes the mobile menu */
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])


  const handleLogout = () => {
    logout()
    closeAll()
    navigate('/')
  }

  const closeAll = () => {
    setMenuOpen(false)
  }

  const desktopLinks = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/offers', label: t('nav.offers') },
    { to: '/shipping', label: t('nav.delivery') },
  ]

  const mobileLinks = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/offers', label: t('nav.offers') },
    { to: '/shipping', label: t('nav.delivery') },
    { to: '/about', label: t('nav.about') },
    ...(isLoggedIn ? [
      { to: '/orders',   label: t('nav.myOrders')  },
      { to: '/wishlist', label: t('nav.wishlist')  },
      { to: '/profile',  label: t('nav.profile')   },
    ] : [
      { action: 'login',    label: t('nav.signIn') },
      { action: 'register', label: t('nav.createAccount') },
    ]),
    ...(isAdmin ? [{ to: '/admin', label: t('nav.adminPanel') }] : []),
  ]

  const iconBtn = 'relative flex items-center justify-center w-9 h-9 rounded-xl text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#F9EEF0] transition-all duration-200'

  return (
    <header
      className={[
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_24px_rgba(107,31,42,0.08)] border-b border-[#F0D5D8]/80'
          : 'bg-white border-b border-[#F0D5D8]',
      ].join(' ')}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center h-[72px] md:h-[88px] gap-6">

          {/* ── LEFT: Hamburger (mobile) ────────────────────────── */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={`${iconBtn} md:hidden shrink-0`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="flex flex-col gap-[5px] w-5">
              <span className={`block h-px bg-current transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
              <span className={`block h-px bg-current transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block h-px bg-current transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
            </span>
          </button>

          {/* ── CENTER / LEFT on desktop: Logo ─────────────────── */}
          <Link
            to="/"
            onClick={() => { closeAll(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex flex-col items-center hover:opacity-75 transition-opacity select-none shrink-0 mx-auto md:mx-0"
          >
            <img
              src="/images/iwear-logo.jpg"
              alt="I Wear Logo"
              className="h-14 md:h-[72px] max-w-[200px] object-contain"
            />
          </Link>

          {/* ── CENTER: Desktop nav links ───────────────────────── */}
          <nav className="hidden md:flex items-center gap-6 mx-auto">
            {desktopLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={closeAll}
                className={({ isActive }) => [
                  'text-[11px] tracking-[0.18em] uppercase font-medium transition-colors duration-200 relative group',
                  isActive ? 'text-[#6B1F2A]' : 'text-[#9B7B80] hover:text-[#6B1F2A]',
                ].join(' ')}
              >
                {({ isActive }) => (
                  <>
                    {label}
                    <span className={[
                      'absolute -bottom-1 left-0 right-0 h-px bg-[#DFA3AD] transition-transform duration-300 origin-left',
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                    ].join(' ')} />
                  </>
                )}
              </NavLink>
            ))}

          </nav>

          {/* ── RIGHT: Icon cluster ─────────────────────────────── */}
          <div className="flex items-center gap-0.5 shrink-0">

            {/* Search — desktop only (mobile uses the bottom nav) */}
            <button onClick={() => { closeAll(); openSearch() }} aria-label="Search" className={`${iconBtn} hidden md:flex`}>
              <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Instagram — all devices */}
            <a
              href="https://www.instagram.com/iwear1_boutique/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={iconBtn}
            >
              <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>

            {/* Account — desktop only */}
            {isLoggedIn ? (
              <div ref={userMenuRef} className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  aria-label="Account"
                  aria-expanded={userMenuOpen}
                  className={iconBtn}
                >
                  <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute end-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_8px_28px_rgba(107,31,42,0.12)] border border-[#F0D5D8] py-2 z-50 animate-fade-in-scale origin-top-end">
                    {user?.name && (
                      <div className="px-4 py-2 border-b border-[#F9E8EB]">
                        <p className="text-[11px] uppercase tracking-[0.15em] text-[#9B7B80]">{t('nav.signedInAs')}</p>
                        <p className="text-sm font-medium text-[#3D1A1E] truncate" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '15px' }}>
                          {user.name}
                        </p>
                      </div>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs tracking-[0.12em] uppercase text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#F9EEF0] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t('nav.profile')}
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs tracking-[0.12em] uppercase text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#F9EEF0] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {t('nav.myOrders')}
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs tracking-[0.12em] uppercase text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#F9EEF0] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('nav.adminPanel')}
                      </Link>
                    )}

                    <div className="my-1 border-t border-[#F9E8EB]" />

                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout() }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs tracking-[0.12em] uppercase text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t('nav.signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => { closeAll(); openLogin() }} aria-label="Account" className={`${iconBtn} hidden md:flex`}>
                <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}

            {/* Wishlist — desktop only (mobile uses the bottom nav).
                Icon-only by design: the count is shown on the wishlist page itself. */}
            <Link to="/wishlist" onClick={closeAll} aria-label="Wishlist" className={`${iconBtn} hidden md:flex`}>
              <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Cart — opens drawer instead of navigating */}
            <button
              type="button"
              onClick={() => { closeAll(); openCart() }}
              aria-label={t('nav.cart')}
              title={t('nav.cart')}
              className="group relative flex items-center text-[#9B7B80] hover:text-[#6B1F2A] transition-all duration-200"
            >
              {/* Icon + badge wrapper. The `key` forces a remount on every add
                  so the heartbeat animation can replay. */}
              <span
                key={`cart-icon-${cartBumpKey}`}
                className={[
                  'relative inline-flex items-center justify-center shrink-0',
                  'w-10 h-10 rounded-xl',
                  'group-hover:bg-[#F9EEF0] group-hover:scale-[1.06] active:scale-95',
                  'transition-all duration-200',
                  cartBumpKey > 0 ? 'animate-heartbeat' : '',
                ].join(' ')}
              >
                <CartIcon className="w-5 h-5" />

                {/* Item-count badge — same on mobile and desktop */}
                {cart?.totalItems > 0 && (
                  <span
                    className={[
                      'absolute -top-1 -end-1',
                      'min-w-[17px] h-[17px] px-[4px]',
                      'bg-[#6B1F2A] text-white rounded-full',
                      'flex items-center justify-center font-bold',
                      'ring-2 ring-white shadow-[0_1px_4px_rgba(107,31,42,0.35)]',
                    ].join(' ')}
                    style={{ fontSize: '9px', lineHeight: 1 }}
                  >
                    {cart.totalItems > 99 ? '99+' : cart.totalItems}
                  </span>
                )}
              </span>

            </button>

            {/* Language toggle — desktop only (mobile lives inside the slide-down menu) */}
            <div className="hidden md:flex items-center ms-1.5">
              <LanguageToggle />
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile slide-down menu ──────────────────────────────── */}

      {/* Backdrop — portalled to <body> so it sits below the sticky header
          (header z-50 > backdrop z-40 > page content z-0).
          Tapping it closes the menu. */}
      {menuOpen && createPortal(
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={closeAll}
          aria-hidden="true"
        />,
        document.body,
      )}

      {/* Menu panel — always in DOM so open/close both animate.
          max-height + opacity give a smooth slide-down on open and
          slide-up on close. pointer-events-none hides it from interaction
          while collapsed. */}
      <div
        className={[
          'md:hidden overflow-hidden bg-white',
          'transition-[max-height,opacity] duration-300 ease-in-out',
          menuOpen ? 'max-h-[640px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none',
        ].join(' ')}
      >
        {/* Border lives inside so it's clipped with the content when max-h-0 */}
        <div className="border-t border-[#F0D5D8]">
          <nav className="px-6 py-3 max-w-2xl mx-auto">
            {/* Language toggle — top of mobile menu */}
            <div className="flex items-center justify-between py-3.5 border-b border-[#F9E8EB]">
              <span className="text-xs tracking-[0.15em] uppercase text-[#9B7B80]">
                {t('common.language')}
              </span>
              <LanguageToggle />
            </div>

            {mobileLinks.map((item) => {
              const baseRowClass = 'w-full text-start flex items-center py-3.5 text-xs tracking-[0.15em] uppercase border-b border-[#F9E8EB] transition-colors duration-200'
              if (item.action) {
                return (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() => {
                      closeAll()
                      if (item.action === 'login') openLogin()
                      else openRegister()
                    }}
                    className={`${baseRowClass} text-[#9B7B80] hover:text-[#6B1F2A]`}
                  >
                    {item.label}
                  </button>
                )
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeAll}
                  className={({ isActive }) => [
                    baseRowClass,
                    isActive ? 'text-[#6B1F2A] font-semibold' : 'text-[#9B7B80] hover:text-[#6B1F2A]',
                  ].join(' ')}
                >
                  {item.label}
                </NavLink>
              )
            })}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="w-full text-start py-3.5 text-xs tracking-[0.15em] uppercase text-[#9B7B80] hover:text-[#6B1F2A] transition-colors duration-200 border-b border-[#F9E8EB]"
              >
                {t('nav.signOut')}
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
