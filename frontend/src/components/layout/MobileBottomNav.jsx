import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { useLanguage } from '../../context/LanguageContext'
import { useUI } from '../../context/UIContext'

/**
 * Fixed bottom navigation for mobile / small tablets (below md).
 * Hidden on desktop via `md:hidden`.
 *
 * Order: Home · Search · Profile · Wishlist · WhatsApp
 *
 *  - Profile destination is `/profile` for authenticated users and `/login`
 *    for guests, derived from AuthContext.
 *  - WhatsApp uses the contactWhatsApp number from SiteSettingsContext, with
 *    a fallback to the same number Footer.jsx uses.
 *  - Active route is highlighted via NavLink's `isActive` callback.
 *  - Includes safe-area inset padding so the bar respects the iPhone home
 *    indicator.
 */

const WHATSAPP_FALLBACK = '972594828117'
const ICON_BASE = 'w-[22px] h-[22px]'

const HomeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} className={ICON_BASE}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12L11.204 3.045c.439-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
  </svg>
)

const SearchIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} className={ICON_BASE}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ProfileIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} className={ICON_BASE}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const HeartIcon = ({ filled }) => (
  <svg fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} className={ICON_BASE}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

/** Official WhatsApp logo (same path used in Footer.jsx). */
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[24px] h-[24px]">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const labelClass = 'text-[9px] tracking-[0.1em] uppercase font-medium leading-none'

const linkClass = ({ isActive }) => [
  'relative flex flex-1 flex-col items-center justify-center gap-1 h-full',
  'transition-all duration-200 active:scale-90',
  isActive ? 'text-[#6B1F2A]' : 'text-[#9B7B80] hover:text-[#6B1F2A]',
].join(' ')

const ActiveBar = () => (
  <span className="absolute top-1.5 w-5 h-[2px] rounded-full bg-[#DFA3AD]" />
)

export default function MobileBottomNav() {
  const { isLoggedIn } = useAuth()
  const { contactWhatsApp } = useSiteSettings()
  const { t } = useLanguage()
  const { openLogin, openSearch } = useUI()

  const phone = (contactWhatsApp || WHATSAPP_FALLBACK).replace(/\D/g, '')
  const whatsAppUrl = `https://wa.me/${phone}`

  return (
    <nav
      aria-label="Bottom navigation"
      className={[
        'md:hidden fixed bottom-0 inset-x-0 z-50',
        'bg-white/95 backdrop-blur-md',
        'border-t border-[#F0D5D8]',
        'shadow-[0_-4px_24px_rgba(107,31,42,0.08)]',
        'pb-[env(safe-area-inset-bottom)]',
      ].join(' ')}
    >
      <div className="flex items-stretch justify-around h-16 max-w-screen-sm mx-auto px-1">

        {/* Home */}
        <NavLink to="/" end className={linkClass} aria-label={t('nav.home')}>
          {({ isActive }) => (
            <>
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                <HomeIcon />
              </span>
              <span className={labelClass}>{t('nav.home')}</span>
              {isActive && <ActiveBar />}
            </>
          )}
        </NavLink>

        {/* Search → opens search overlay */}
        <button onClick={() => openSearch()} className={linkClass({ isActive: false })} aria-label={t('common.search')}>
          <span className="transition-transform duration-200">
            <SearchIcon />
          </span>
          <span className={labelClass}>{t('common.search')}</span>
        </button>

        {/* Profile — /profile when authenticated, opens auth drawer for guests */}
        {isLoggedIn ? (
          <NavLink to="/profile" className={linkClass} aria-label={t('nav.profile')}>
            {({ isActive }) => (
              <>
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  <ProfileIcon />
                </span>
                <span className={labelClass}>{t('nav.profile')}</span>
                {isActive && <ActiveBar />}
              </>
            )}
          </NavLink>
        ) : (
          <button
            type="button"
            onClick={openLogin}
            aria-label={t('nav.profile')}
            className={[
              'relative flex flex-1 flex-col items-center justify-center gap-1 h-full',
              'text-[#9B7B80] hover:text-[#6B1F2A]',
              'transition-all duration-200 active:scale-90',
            ].join(' ')}
          >
            <span className="transition-transform duration-200">
              <ProfileIcon />
            </span>
            <span className={labelClass}>{t('nav.profile')}</span>
          </button>
        )}

        {/* Wishlist (heart fills when active) */}
        <NavLink to="/wishlist" className={linkClass} aria-label={t('nav.wishlist')}>
          {({ isActive }) => (
            <>
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                <HeartIcon filled={isActive} />
              </span>
              <span className={labelClass}>{t('nav.wishlist')}</span>
              {isActive && <ActiveBar />}
            </>
          )}
        </NavLink>

        {/* WhatsApp — external link, official brand green */}
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className={[
            'relative flex flex-1 flex-col items-center justify-center gap-1 h-full',
            'text-[#25D366] hover:text-[#128C7E]',
            'transition-all duration-200 active:scale-90',
          ].join(' ')}
        >
          <span className="transition-transform duration-200 hover:scale-110">
            <WhatsAppIcon />
          </span>
          <span className={labelClass}>WhatsApp</span>
        </a>

      </div>
    </nav>
  )
}
