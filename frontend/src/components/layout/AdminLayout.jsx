import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import AdminBottomNav from './AdminBottomNav'
import LanguageToggle from '../ui/LanguageToggle'
import NotificationBell from '../admin/NotificationBell'

/* ─── Brand palette (mirrors customer store) ──────────────────────────────
   primary:      #6B1F2A   deep rose
   accent:       #DFA3AD   blush pink
   accent-light: #EDD8DC   pale blush
   bg-store:     #FDF6F7   warm white
   bg-light:     #FDF0F2   light rose
   text:         #3D1A1E   dark rose
   muted:        #9B7B80   muted rose
   ──────────────────────────────────────────────────────────────────────── */

const getNavItems = (t) => [
  { to: '/admin',            label: t('admin.dashboard'),   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/admin/products',   label: t('admin.products'),    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/admin/orders',     label: t('admin.orders'),      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to: '/admin/categories', label: t('admin.categories'),  icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
  { to: '/admin/seasons',    label: t('admin.seasons'),     icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
  { to: '/admin/users',      label: t('admin.users'),       icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { to: '/admin/reviews',    label: t('admin.reviews'),     icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { to: '/admin/offers',     label: t('admin.offers'),      icon: 'M7 7h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
  { to: '/admin/stock',      label: t('admin.stockAlerts'), icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', alert: true },
  { to: '/admin/settings',   label: t('admin.settings'),    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

const getPageTitles = (t) => ({
  '/admin':            t('admin.dashboard'),
  '/admin/products':   t('admin.products'),
  '/admin/categories': t('admin.categories'),
  '/admin/seasons':    t('admin.seasons'),
  '/admin/orders':     t('admin.orders'),
  '/admin/users':      t('admin.users'),
  '/admin/reviews':    t('admin.reviews'),
  '/admin/offers':     t('admin.offers'),
  '/admin/stock':      t('admin.stockAlerts'),
  '/admin/settings':   t('admin.settings'),
})

/* ─── Sidebar ──────────────────────────────────────────────────────────── */
function Sidebar({ onClose }) {
  const { logout } = useAuth()
  const { t } = useLanguage()
  const { siteName, logoUrl } = useSiteSettings()
  const navigate   = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }
  const NAV_ITEMS = getNavItems(t)

  const linkClass = ({ isActive }) => [
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200',
    'font-medium tracking-[0.01em]',
    isActive
      ? 'bg-[#FDF0F2] text-[#6B1F2A] font-semibold border-s-[2.5px] border-[#6B1F2A] shadow-sm'
      : 'text-[#9B7B80] border-s-[2.5px] border-transparent hover:bg-[#FDF6F7] hover:text-[#6B1F2A] hover:border-[#EDD8DC]',
  ].join(' ')

  return (
    <div className="flex flex-col h-full max-h-screen bg-white overflow-hidden" style={{ borderInlineEnd: '1px solid #F0DDE0' }}>

      {/* ── Brand — dynamic logo from settings ── */}
      <div className="px-6 pt-6 pb-5 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 flex flex-col items-center mb-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName || 'Store logo'}
                className="h-12 max-w-full object-contain"
              />
            ) : (
              <p className="truncate text-center" style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontWeight: 500,
                letterSpacing: '0.18em',
                fontSize: '18px',
                color: '#6B1F2A',
                lineHeight: 1.1,
              }}>
                {siteName || 'Store Name'}
              </p>
            )}
            <p className="text-[9px] tracking-[0.25em] text-[#C4A0A6] mt-2 uppercase"
               style={{ fontFamily: 'Raleway, sans-serif' }}>
              {t('admin.adminPanel')}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose}
              className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[#C4A0A6] hover:bg-[#FDF0F2] hover:text-[#6B1F2A] transition-colors shrink-0 self-start">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="divider-rose" />
      </div>

      {/* ── Scrollable navigation ── */}
      <nav className="flex-1 min-h-0 px-3 py-2 overflow-y-auto overscroll-contain space-y-1" style={{ scrollBehavior: 'smooth' }}>
        {NAV_ITEMS.map(({ to, label, icon, alert }) => (
          <NavLink key={to} to={to} end={to === '/admin'} onClick={onClose} className={linkClass}>
            <span className="relative shrink-0">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              {alert && (
                <span className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-amber-400 border border-white" />
              )}
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 py-4 shrink-0 space-y-1" style={{ borderTop: '1px solid #F5EDEF' }}>
        <a href="/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#9B7B80] hover:bg-[#FDF6F7] hover:text-[#6B1F2A] transition-colors">
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          {t('admin.viewStore')}
        </a>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#9B7B80] hover:bg-red-50 hover:text-red-700 transition-colors">
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('nav.signOut')}
        </button>
      </div>
    </div>
  )
}

/* ─── Topbar ───────────────────────────────────────────────────────────── */
function Topbar({ onMenuClick }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const location  = useLocation()
  const PAGE_TITLES = getPageTitles(t)

  const pageTitle = (() => {
    if (location.pathname.startsWith('/admin/products/') && location.pathname.endsWith('/edit')) return 'Edit Product'
    if (location.pathname === '/admin/products/new') return 'New Product'
    if (location.pathname.startsWith('/admin/orders/')) return 'Order Details'
    return PAGE_TITLES[location.pathname] || 'Admin'
  })()

  const initial = (user?.name || user?.email || 'A').charAt(0).toUpperCase()

  return (
    <header
      className="h-14 flex items-center gap-4 px-5 shrink-0 sticky top-0 z-30"
      style={{
        background: '#fff',
        borderBottom: '1px solid #F0DDE0',
        boxShadow: '0 1px 8px rgba(107,31,42,0.05)',
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0"
        style={{ color: '#9B7B80' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FDF0F2'; e.currentTarget.style.color = '#6B1F2A' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9B7B80' }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Spacer — page title is rendered by <PageHeader /> below the topbar */}
      <div className="flex-1" />


      {/* Right side */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="w-px h-5 hidden sm:block" style={{ background: '#EDD8DC' }} />

        <LanguageToggle />

        <div className="w-px h-5 hidden sm:block" style={{ background: '#EDD8DC' }} />

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FDF0F2 0%, #EDD8DC 100%)',
              color: '#6B1F2A',
              border: '1px solid #EDD8DC',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '14px',
            }}
          >
            {initial}
          </div>
          {user?.name && (
            <span className="text-xs font-medium hidden lg:block" style={{ color: '#9B7B80', fontFamily: 'Raleway, sans-serif' }}>
              {user.name}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}

/* ─── Layout ───────────────────────────────────────────────────────────── */
export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex" style={{ background: '#FDF6F7' }}>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-[228px] shrink-0 sticky top-0 h-screen z-40"
        style={{ boxShadow: '2px 0 12px rgba(107,31,42,0.06)' }}
      >
        <Sidebar />
      </aside>

      {/* Mobile drawer — always in DOM so CSS transitions play on both open and close */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${sidebarOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(61,26,30,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sliding panel */}
        <aside
          className={`absolute start-0 top-0 h-full w-[228px] z-50 flex flex-col transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}`}
          style={{ boxShadow: '4px 0 24px rgba(107,31,42,0.15)' }}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
        <AdminBottomNav />
      </div>
    </div>
  )
}
