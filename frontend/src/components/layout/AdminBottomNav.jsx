import { NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

/**
 * Fixed bottom navigation for the admin panel — mobile only (md:hidden).
 *
 * 5 nav tabs + 1 logout action button.
 */

const NAV_ITEMS = [
  {
    to: '/admin',
    labelKey: 'admin.dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    end: true,
  },
  {
    to: '/admin/products',
    labelKey: 'admin.products',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    to: '/admin/orders',
    labelKey: 'admin.orders',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    to: '/admin/categories',
    labelKey: 'admin.categories',
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  },
  {
    to: '/admin/settings',
    labelKey: 'admin.settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

const LOGOUT_ICON = 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'

const linkClass = ({ isActive }) => [
  'relative flex flex-1 flex-col items-center justify-center gap-1 h-full',
  'transition-all duration-200 active:scale-90',
  isActive ? 'text-[#6B1F2A]' : 'text-[#9B7B80]',
].join(' ')

export default function AdminBottomNav() {
  const { t } = useLanguage()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav
      aria-label="Admin bottom navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#F0D5D8] shadow-[0_-2px_16px_rgba(107,31,42,0.08)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-stretch justify-around h-16">
        {NAV_ITEMS.map(({ to, labelKey, icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} aria-label={t(labelKey)}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-1.5 w-5 h-[2px] rounded-full bg-[#DFA3AD]" />
                )}
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </span>
                <span className="text-[9px] tracking-[0.06em] font-medium leading-none">
                  {t(labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* Logout — action button, not a NavLink */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label={t('nav.signOut')}
          className="relative flex flex-1 flex-col items-center justify-center gap-1 h-full text-[#9B7B80] hover:text-red-600 transition-all duration-200 active:scale-90"
        >
          <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d={LOGOUT_ICON} />
          </svg>
          <span className="text-[9px] tracking-[0.06em] font-medium leading-none">
            {t('nav.signOut')}
          </span>
        </button>
      </div>
    </nav>
  )
}
