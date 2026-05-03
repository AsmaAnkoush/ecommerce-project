import { useLocation } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

/* Default route resolver — used only when title/subtitle/icon aren't supplied. */
function resolvePage(pathname, t) {
  const map = [
    { match: '/admin/products/new',      title: 'admin.addProduct',        sub: 'admin.headerProductsSub',   icon: '📦', color: '#7B1E2B' },
    { match: /^\/admin\/products\/\d+/,  title: 'admin.edit',              sub: 'admin.headerProductsSub',   icon: '📦', color: '#7B1E2B' },
    { match: '/admin/products',          title: 'admin.products',          sub: 'admin.headerProductsSub',   icon: '📦', color: '#7B1E2B' },
    { match: /^\/admin\/orders\/\d+/,    title: 'orders.orderDetails',     sub: 'admin.headerOrdersSub',     icon: '🧾', color: '#7B1E2B' },
    { match: '/admin/orders',            title: 'admin.orders',            sub: 'admin.headerOrdersSub',     icon: '🧾', color: '#7B1E2B' },
    { match: '/admin/categories',        title: 'admin.categories',        sub: 'admin.headerCategoriesSub', icon: '📂', color: '#7B1E2B' },
    { match: '/admin/users',             title: 'admin.users',             sub: 'admin.headerUsersSub',      icon: '👥', color: '#7B1E2B' },
    { match: '/admin/reviews',           title: 'admin.reviews',           sub: 'admin.headerReviewsSub',    icon: '⭐', color: '#7B1E2B' },
    { match: '/admin/offers',            title: 'admin.offersDiscounts',   sub: 'admin.headerOffersSub',     icon: '🏷️', color: '#7B1E2B' },
    { match: '/admin/settings',          title: 'admin.websiteSettings',   sub: 'admin.headerSettingsSub',      icon: '⚙️', color: '#7B1E2B' },
    { match: '/admin/shipping-zones',    title: 'admin.shippingZones',     sub: 'admin.headerShippingZonesSub', icon: '🚚', color: '#7B1E2B' },
    { match: '/admin',                   title: 'admin.dashboard',         sub: 'admin.headerDashboardSub',     icon: '📊', color: '#7B1E2B' },
  ]
  for (const entry of map) {
    if (typeof entry.match === 'string' ? pathname === entry.match || pathname.startsWith(entry.match + '/')
                                         : entry.match.test(pathname)) {
      return { title: t(entry.title), subtitle: t(entry.sub), icon: entry.icon, color: entry.color }
    }
  }
  return { title: t('admin.dashboard'), subtitle: '', icon: '📊', color: '#7B1E2B' }
}

/**
 * Reusable admin page header.
 *
 * Props (all optional — falls back to a route-based resolver when omitted):
 *   - title:     string         — main heading
 *   - subtitle:  string         — supporting line under the title
 *   - icon:      ReactNode      — emoji string or any node (rendered in the right tile)
 *   - color:     string         — hex base color used to build the gradient (e.g. '#7B1E2B')
 *   - gradient:  string         — full CSS gradient (overrides `color` when supplied)
 *   - className: string         — extra wrapper classes
 */
export default function PageHeader({ title, subtitle, icon, color, gradient, className = '' }) {
  const { t, isRTL } = useLanguage()
  const { pathname } = useLocation()
  const resolved = resolvePage(pathname, t)

  const finalTitle    = title    ?? resolved.title
  const finalSubtitle = subtitle ?? resolved.subtitle
  const finalIcon     = icon     ?? resolved.icon
  const baseColor     = color    ?? resolved.color
  const finalGradient = gradient || `linear-gradient(135deg, ${baseColor} 0%, ${shade(baseColor, 0.12)} 50%, ${shade(baseColor, 0.25)} 100%)`

  return (
    <section
      className={`relative overflow-hidden rounded-2xl shadow-md mb-6 mt-5 mx-5 lg:mx-7 p-5 sm:p-6 animate-fade-in-up ${className}`}
      style={{
        background: finalGradient,
        boxShadow: `0 10px 30px ${withAlpha(baseColor, 0.22)}`,
      }}
    >
      <div
        className={`absolute -top-12 ${isRTL ? '-start-12' : '-end-12'} w-40 h-40 rounded-full opacity-20 blur-2xl pointer-events-none`}
        style={{ background: '#ffffff' }}
      />
      <div
        className={`absolute -bottom-12 ${isRTL ? '-end-10' : '-start-10'} w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none`}
        style={{ background: '#ffffff' }}
      />

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1
            className="text-xl sm:text-2xl font-semibold text-white truncate"
            style={{ fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.02em' }}
          >
            {finalTitle}
          </h1>
          {finalSubtitle && (
            <p className="text-xs sm:text-sm text-white/80 mt-1 truncate"
               style={{ fontFamily: 'Raleway, sans-serif' }}>
              {finalSubtitle}
            </p>
          )}
        </div>
        {finalIcon && (
          <div
            className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl border border-white/20"
            aria-hidden="true"
          >
            {finalIcon}
          </div>
        )}
      </div>
    </section>
  )
}

/* ── tiny helpers (no extra deps) ───────────────────────────────────────── */
function withAlpha(hex, a) {
  const { r, g, b } = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
function shade(hex, ratio) {
  // Lightens toward white by `ratio` (0..1).
  const { r, g, b } = parseHex(hex)
  const mix = (c) => Math.round(c + (255 - c) * ratio)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}
function parseHex(hex) {
  const v = hex.replace('#', '')
  const full = v.length === 3 ? v.split('').map(c => c + c).join('') : v
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}
