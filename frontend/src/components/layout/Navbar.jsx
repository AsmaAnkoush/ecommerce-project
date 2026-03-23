import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { getSettings } from '../../api/adminApi'

const FloralDot = () => (
  <svg width="38" height="14" viewBox="0 0 38 14" fill="none">
    <path d="M19 5 Q17 2 15 5 Q17 8 19 5Z" fill="#E8BDC4" opacity="0.8"/>
    <path d="M19 5 Q21 2 23 5 Q21 8 19 5Z" fill="#E8BDC4" opacity="0.8"/>
    <path d="M19 9 Q17 12 15 9 Q17 6 19 9Z" fill="#E8BDC4" opacity="0.8"/>
    <path d="M19 9 Q21 12 23 9 Q21 6 19 9Z" fill="#E8BDC4" opacity="0.8"/>
    <path d="M15 7 Q12 5 13 7 Q12 9 15 7Z" fill="#E8BDC4" opacity="0.7"/>
    <path d="M23 7 Q26 5 25 7 Q26 9 23 7Z" fill="#E8BDC4" opacity="0.7"/>
    <circle cx="19" cy="7" r="2.2" fill="#DFA3AD" opacity="0.9"/>
    <circle cx="9"  cy="7" r="1.4" fill="#E8BDC4" opacity="0.55"/>
    <circle cx="29" cy="7" r="1.4" fill="#E8BDC4" opacity="0.55"/>
    <circle cx="4"  cy="7" r="0.9" fill="#E8BDC4" opacity="0.35"/>
    <circle cx="34" cy="7" r="0.9" fill="#E8BDC4" opacity="0.35"/>
  </svg>
)

export default function Navbar() {
  const { user, logout, isLoggedIn, isAdmin } = useAuth()
  const { cart }     = useCart()
  const { wishlist } = useWishlist()
  const navigate = useNavigate()

  const [menuOpen,     setMenuOpen]     = useState(false)
  const [userDropOpen, setUserDropOpen] = useState(false)
  const [logoUrl,      setLogoUrl]      = useState('')

  useEffect(() => {
    getSettings().then(res => setLogoUrl(res.data?.data?.logoUrl || '')).catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    closeAll()
    navigate('/')
  }

  const closeAll = () => {
    setMenuOpen(false)
    setUserDropOpen(false)
  }

  const navLinks = [
    { to: '/',         label: 'الرئيسية',    end: true },
    { to: '/products', label: 'تسوّقي' },
    ...(isLoggedIn ? [
      { to: '/orders',   label: 'طلباتي'   },
      { to: '/wishlist', label: 'Wishlist'  },
      { to: '/profile',  label: 'حسابي'    },
    ] : [
      { to: '/login',    label: 'Login'           },
      { to: '/register', label: 'إنشاء حساب' },
    ]),
    ...(isAdmin ? [{ to: '/admin', label: 'لوحة التحكم' }] : []),
  ]

  return (
    <header
      className="sticky top-0 z-50 bg-white border-b border-[#F0D5D8]"
      style={{ boxShadow: '0 1px 8px rgba(107,31,42,0.06)' }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[80px] md:h-[100px]">

          {/* ── LEFT: Hamburger ──────────────────────────────────── */}
          <button
            onClick={() => { setMenuOpen(v => !v); setUserDropOpen(false) }}
            className="flex items-center justify-center w-9 h-9 text-[#9B7B80] hover:text-[#6B1F2A] transition-colors rounded-xl hover:bg-[#FDF0F2]"
            aria-label="Open menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* ── CENTER: Logo ──────────────────────────────────────── */}
          <Link to="/" onClick={closeAll} className="flex flex-col items-center hover:opacity-80 transition-opacity select-none">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Store logo"
                className="h-16 md:h-[88px] max-w-[220px] object-contain"
                style={{ background: 'transparent', border: 'none', outline: 'none', padding: 0, display: 'block' }}
              />
            ) : (
              <>
                <span style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontWeight: 400,
                  letterSpacing: '0.45em',
                  fontSize: '19px',
                  color: '#6B1F2A',
                  lineHeight: 1,
                }}>
                  I W E A R
                </span>
                <span style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '11px',
                  letterSpacing: '0.25em',
                  color: '#C4A0A6',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}>
                  boutique
                </span>
                <FloralDot />
              </>
            )}
          </Link>

          {/* ── RIGHT: Icons ──────────────────────────────────────── */}
          <div className="flex items-center gap-0.5">

            {/* Search */}
            <Link
              to="/products"
              onClick={closeAll}
              aria-label="Search"
              className="flex items-center justify-center w-8 h-8 text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#FDF0F2] rounded-xl transition-colors"
            >
              <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Profile / User dropdown */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => { setUserDropOpen(v => !v); setMenuOpen(false) }}
                  aria-label="Profile"
                  className="flex items-center justify-center w-8 h-8 text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#FDF0F2] rounded-xl transition-colors"
                >
                  <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                {userDropOpen && (
                  <div className="absolute end-0 mt-2 w-48 bg-white border border-[#F0D5D8] rounded-2xl shadow-xl py-2 z-50 animate-slide-down">
                    <div className="px-4 py-3 border-b border-[#F9E8EB]">
                      <p className="text-xs font-semibold text-[#3D1A1E]" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '14px' }}>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-[10px] text-[#9B7B80] truncate mt-0.5">{user?.email}</p>
                    </div>
                    <Link to="/profile"  onClick={closeAll} className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#6B3840] hover:bg-[#FDF0F2] hover:text-[#6B1F2A] transition-colors">حسابي</Link>
                    <Link to="/orders"   onClick={closeAll} className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#6B3840] hover:bg-[#FDF0F2] hover:text-[#6B1F2A] transition-colors">طلباتي</Link>
                    {isAdmin && (
                      <Link to="/admin"  onClick={closeAll} className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#6B1F2A] hover:bg-[#FDF0F2] font-medium transition-colors">لوحة التحكم</Link>
                    )}
                    <div className="border-t border-[#F9E8EB] mt-1 pt-1">
                      <button onClick={handleLogout} className="w-full text-start flex items-center gap-2 px-4 py-2.5 text-xs text-[#9B7B80] hover:bg-[#FDF0F2] hover:text-[#6B1F2A] transition-colors">
                        تسجيل خروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                onClick={closeAll}
                aria-label="Sign in"
                className="flex items-center justify-center w-8 h-8 text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#FDF0F2] rounded-xl transition-colors"
              >
                <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

            {/* Wishlist */}
            <Link
              to={isLoggedIn ? '/wishlist' : '/login'}
              onClick={closeAll}
              aria-label="Wishlist"
              className="relative flex items-center justify-center w-8 h-8 text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#FDF0F2] rounded-xl transition-colors"
            >
              <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlist?.length > 0 && (
                <span className="absolute top-0.5 end-0.5 bg-[#6B1F2A] text-white rounded-full flex items-center justify-center font-medium"
                  style={{ fontSize: '7px', width: '12px', height: '12px', lineHeight: 1 }}>
                  {wishlist.length > 9 ? '9+' : wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              onClick={closeAll}
              aria-label="Cart"
              className="relative flex items-center justify-center w-8 h-8 text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#FDF0F2] rounded-xl transition-colors"
            >
              <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cart?.totalItems > 0 && (
                <span className="absolute top-0.5 end-0.5 bg-[#6B1F2A] text-white rounded-full flex items-center justify-center font-medium"
                  style={{ fontSize: '7px', width: '12px', height: '12px', lineHeight: 1 }}>
                  {cart.totalItems > 9 ? '9+' : cart.totalItems}
                </span>
              )}
            </Link>

          </div>
        </div>
      </div>

      {/* ── Slide-down navigation menu ────────────────────────────── */}
      {menuOpen && (
        <div className="bg-white border-t border-[#F0D5D8] animate-slide-down">
          <nav className="px-6 py-2 max-w-2xl mx-auto flex flex-col">
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={closeAll}
                className={({ isActive }) =>
                  `py-3.5 text-sm border-b border-[#F9E8EB] transition-colors tracking-wide
                   ${isActive
                     ? 'text-[#6B1F2A] font-semibold'
                     : 'text-[#9B7B80] hover:text-[#6B1F2A]'
                   }`
                }
              >
                {label}
              </NavLink>
            ))}

            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="py-3.5 text-sm text-start text-[#9B7B80] hover:text-[#6B1F2A] transition-colors tracking-wide"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
