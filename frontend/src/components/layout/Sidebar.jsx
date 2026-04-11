import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useUI } from '../../context/UIContext'
import { useLanguage } from '../../context/LanguageContext'

// ── Icons ────────────────────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const ShopIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)
const CategoryIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)
const CartIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)
const OrdersIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)
const ProfileIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const HeartIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)
const LoginIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
)
const LogoutIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// ── Shared nav-link styles ────────────────────────────────────────────────────
const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
    isActive
      ? 'bg-black text-white'
      : 'text-gray-700 hover:bg-gray-100 hover:text-black'
  }`

// ── Badge pill ────────────────────────────────────────────────────────────────
function Badge({ count, active }) {
  if (!count || count === 0) return null
  return (
    <span className={`ms-auto text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium ${active ? 'bg-white text-black' : 'bg-black text-white'}`}>
      {count > 9 ? '9+' : count}
    </span>
  )
}

// ── Inner content (shared between desktop & mobile) ───────────────────────────
function SidebarContent({ onClose }) {
  const { user, isLoggedIn, isAdmin, logout } = useAuth()
  const { cart } = useCart()
  const { wishlist } = useWishlist()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleLogout = () => {
    logout()
    onClose?.()
    navigate('/')
  }

  const close = () => onClose?.()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <Link to="/" onClick={close} className="text-xl font-bold tracking-tight text-black">
          DRIP<span className="text-gray-400">STORE</span>
        </Link>
        {onClose && (
          <button onClick={close} className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden">
            <CloseIcon />
          </button>
        )}
      </div>

      {/* User info (when logged in) */}
      {isLoggedIn && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {user.firstName[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('nav.shop')}</p>

        <NavLink to="/" end onClick={close} className={linkClass}>
          {({ isActive }) => (
            <>
              <HomeIcon />
              <span>{t('nav.home')}</span>
            </>
          )}
        </NavLink>

        <NavLink to="/products" onClick={close} className={linkClass}>
          {({ isActive }) => (
            <>
              <ShopIcon />
              <span>{t('admin.products')}</span>
            </>
          )}
        </NavLink>

        <NavLink to="/products" onClick={close} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black transition-all">
          <CategoryIcon />
          <span>{t('admin.categories')}</span>
        </NavLink>

        <div className="pt-3">
          <p className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('admin.orders')}</p>

          <NavLink to="/cart" onClick={close} className={linkClass}>
            {({ isActive }) => (
              <>
                <CartIcon />
                <span>{t('nav.cart')}</span>
                <Badge count={cart?.totalItems} active={isActive} />
              </>
            )}
          </NavLink>

          {isLoggedIn && (
            <NavLink to="/orders" onClick={close} className={linkClass}>
              {() => (
                <>
                  <OrdersIcon />
                  <span>{t('admin.orders')}</span>
                </>
              )}
            </NavLink>
          )}

          {isLoggedIn && (
            <NavLink to="/wishlist" onClick={close} className={linkClass}>
              {({ isActive }) => (
                <>
                  <HeartIcon />
                  <span>{t('nav.wishlist')}</span>
                  <Badge count={wishlist?.length} active={isActive} />
                </>
              )}
            </NavLink>
          )}
        </div>

        {isLoggedIn && (
          <div className="pt-3">
            <p className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('nav.profile')}</p>

            <NavLink to="/profile" onClick={close} className={linkClass}>
              {() => (
                <>
                  <ProfileIcon />
                  <span>{t('nav.profile')}</span>
                </>
              )}
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer actions */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogoutIcon />
            <span>{t('nav.signOut')}</span>
          </button>
        ) : (
          <>
            <NavLink to="/login" onClick={close} className={linkClass}>
              {() => (
                <>
                  <LoginIcon />
                  <span>{t('nav.signIn')}</span>
                </>
              )}
            </NavLink>
            <Link
              to="/register"
              onClick={close}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-black text-white hover:bg-gray-800 transition-all"
            >
              <ProfileIcon />
              <span>{t('nav.register')}</span>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUI()
  const close = () => setSidebarOpen(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-e border-gray-200 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          {/* Drawer panel — slides in from the start edge */}
          <aside
            className={`absolute top-0 h-full w-72 bg-white shadow-2xl z-50 flex flex-col ${
              'left-0'
            }`}
          >
            <SidebarContent onClose={close} />
          </aside>
        </div>
      )}
    </>
  )
}
