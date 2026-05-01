import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/adminApi'
import Spinner from '../../components/ui/Spinner'
import PageHeader from '../../components/layout/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { useFormatPrice } from '../../utils/formatPrice'

/* ─── Stat card — minimal, centered icon, soft palette ─────────────────── */
function StatCard({ label, value, sub, icon, tint, to }) {
  return (
    <Link
      to={to}
      className="group relative bg-white rounded-2xl p-4 sm:p-6
                 flex flex-col items-center justify-center text-center
                 gap-2 sm:gap-4
                 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg no-underline"
      style={{ boxShadow: '0 2px 12px rgba(107,31,42,0.05), 0 0 0 1px #F5EDEF' }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ background: tint.bg, border: `1px solid ${tint.border}` }}
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: tint.icon }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>

      {/* Value */}
      <div>
        <p
          className="text-[26px] sm:text-[32px] leading-none tabular-nums"
          style={{ color: '#3D1A1E', fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, letterSpacing: '0.01em' }}
        >
          {value}
        </p>
        <p className="text-[10px] sm:text-xs font-medium mt-1.5 sm:mt-2 tracking-wide uppercase" style={{ color: '#9B7B80', fontFamily: 'Raleway, sans-serif', letterSpacing: '0.08em' }}>
          {label}
        </p>
        {sub && (
          <p className="text-[10px] sm:text-[11px] mt-1 hidden sm:block" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>{sub}</p>
        )}
      </div>
    </Link>
  )
}

/* ─── Section header ───────────────────────────────────────────────────── */
function SectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #FAF0F2' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg,#6B1F2A,#DFA3AD)' }} />
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontWeight: 500,
          fontSize: '16px',
          color: '#3D1A1E',
          letterSpacing: '0.02em',
        }}>
          {title}
        </h2>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="text-xs font-medium transition-colors"
          style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = '#6B1F2A'}
          onMouseLeave={e => e.currentTarget.style.color = '#C4A0A6'}
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

/* ─── Card wrapper ─────────────────────────────────────────────────────── */
function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden ${className}`}
      style={{ boxShadow: '0 2px 8px rgba(107,31,42,0.06), 0 0 0 1px #F5EDEF' }}
    >
      {children}
    </div>
  )
}

/* ─── Best seller row ──────────────────────────────────────────────────── */
function BestSellerRow({ item, rank }) {
  const { t } = useLanguage()
  const medalColors = [
    { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
    { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
    { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
  ]
  const m = medalColors[rank] || { bg: '#FDF6F7', text: '#9B7B80', border: '#EDD8DC' }

  return (
    <div
      className="flex items-center gap-4 px-5 py-3 transition-colors"
      style={{ borderBottom: '1px solid #FAF0F2' }}
      onMouseEnter={e => e.currentTarget.style.background = '#FDF6F7'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Rank badge */}
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
        style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}` }}
      >
        {rank + 1}
      </span>

      {/* Product image */}
      <div
        className="w-9 h-9 rounded-xl overflow-hidden shrink-0"
        style={{ background: '#FDF0F2', border: '1px solid #F0DDE0' }}
      >
        {item.productImage
          ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
          : <div className="w-full h-full flex items-center justify-center text-[#DFA3AD] text-xs font-bold">
              {(item.productName || '?').charAt(0)}
            </div>
        }
      </div>

      {/* Name */}
      <p
        className="flex-1 text-sm truncate"
        style={{ color: '#3D1A1E', fontFamily: 'Raleway, sans-serif', fontWeight: 500 }}
      >
        {item.productName}
      </p>

      {/* Units */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-sm font-bold" style={{ color: '#6B1F2A', fontFamily: 'Raleway, sans-serif' }}>
          {item.totalSold}
        </span>
        <span className="text-xs" style={{ color: '#C4A0A6' }}>{t('admin.sold')}</span>
      </div>
    </div>
  )
}

/* ─── Quick action ─────────────────────────────────────────────────────── */
function QuickAction({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium"
      style={{
        color: '#9B7B80',
        border: '1px dashed #EDD8DC',
        textDecoration: 'none',
        fontFamily: 'Raleway, sans-serif',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#FDF0F2'
        e.currentTarget.style.borderColor = '#DFA3AD'
        e.currentTarget.style.color = '#6B1F2A'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = '#EDD8DC'
        e.currentTarget.style.color = '#9B7B80'
      }}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  )
}

/* ─── Overview row ─────────────────────────────────────────────────────── */
function OverviewRow({ label, value, alert }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #FAF0F2' }}>
      <span className="text-sm" style={{ color: '#9B7B80', fontFamily: 'Raleway, sans-serif' }}>{label}</span>
      <span
        className="text-sm font-semibold tabular-nums"
        style={{ color: alert ? '#991B1B' : '#3D1A1E', fontFamily: 'Raleway, sans-serif' }}
      >
        {value}
      </span>
    </div>
  )
}

/* ─── Main ─────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(res => setStats(res.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader />
      <div className="p-4 sm:p-5 lg:p-7 space-y-4 sm:space-y-6 max-w-[1280px]">

      {/* ── Welcome strip — compact, light backdrop, single rose accent ── */}
      <div className="rounded-2xl px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 overflow-hidden relative bg-white border border-[#F0DDE0] shadow-[0_2px_12px_rgba(107,31,42,0.06)]">
        <div className="absolute -top-12 -end-10 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: '#FDF0F2' }} />

        <div className="relative z-10 min-w-0">
          <p className="text-[#3D1A1E] truncate" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1.1 }}>
            {t('admin.welcomeBack')}
          </p>
          <p className="mt-1 text-xs text-[#9B7B80]" style={{ fontFamily: 'Raleway, sans-serif', letterSpacing: '0.04em' }}>
            {t('admin.storeToday')}
          </p>
        </div>

        <div className="relative z-10 hidden sm:inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-[#FDF6F7] border border-[#F0DDE0] text-[#6B1F2A]" style={{ fontFamily: 'Raleway, sans-serif' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ── Low stock alert ── */}
      {stats.lowStockCount > 0 && (
        <Link
          to="/admin/products"
          className="flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-colors"
          style={{
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
            textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FFF8D6'}
          onMouseLeave={e => e.currentTarget.style.background = '#FFFBEB'}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#92400E', fontFamily: 'Raleway, sans-serif' }}>
              {t('admin.lowStockAlert').replace('{count}', stats.lowStockCount)}
            </p>
            <p className="text-xs" style={{ color: '#B45309', marginTop: '2px', fontFamily: 'Raleway, sans-serif' }}>
              {t('admin.tapToRestock')}
            </p>
          </div>
          <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        <StatCard
          label={t('admin.ordersToday')}
          value={stats.ordersToday}
          sub={t('admin.receivedToday')}
          to="/admin/orders"
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          tint={{ bg: '#FDF0F2', border: '#EDD8DC', icon: '#6B1F2A' }}
        />
        <StatCard
          label={t('admin.pendingOrders')}
          value={stats.pendingOrders}
          sub={t('admin.needAttention')}
          to="/admin/orders"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          tint={{ bg: '#FFFBEB', border: '#FCD34D', icon: '#D97706' }}
        />
        <StatCard
          label={t('admin.totalRevenue')}
          value={formatPrice(stats.totalRevenue)}
          sub={t('admin.fromOrders').replace('{count}', stats.totalOrders)}
          to="/admin/orders"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          tint={{ bg: '#ECFDF5', border: '#A7F3D0', icon: '#059669' }}
        />
        <StatCard
          label={t('admin.totalProducts')}
          value={stats.totalProducts}
          sub={stats.totalUsers + ' ' + t('admin.customers')}
          to="/admin/products"
          icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          tint={{ bg: '#F5F3FF', border: '#DDD6FE', icon: '#7C3AED' }}
        />
      </div>

      {/* ── Sales analytics ── */}
      <Card>
        <SectionHeader title={t('admin.revenueAnalytics')} linkTo="/admin/orders" linkLabel={t('admin.viewAll')} />
        {/* Mobile: scrollable row so values are never truncated.  sm+: 3-column grid. */}
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-5 py-4 sm:py-5 min-w-[340px]">
          {[
            { key: 'daily',   label: t('admin.revenueDaily'),   value: stats.revenueDaily,   tile: { bg: '#ECFDF5', border: '#A7F3D0', icon: '#059669', valueColor: '#065F46' }, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { key: 'weekly',  label: t('admin.revenueWeekly'),  value: stats.revenueWeekly,  tile: { bg: '#FFFBEB', border: '#FCD34D', icon: '#D97706', valueColor: '#92400E' }, icon: 'M3 12h18M3 6h18M3 18h18' },
            { key: 'monthly', label: t('admin.revenueMonthly'), value: stats.revenueMonthly, tile: { bg: '#F5F3FF', border: '#DDD6FE', icon: '#7C3AED', valueColor: '#5B21B6' }, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map(c => (
            <div
              key={c.key}
              className="group rounded-2xl p-3 sm:p-6 flex flex-col items-center justify-center text-center gap-2 sm:gap-3 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{ background: c.tile.bg, border: `1px solid ${c.tile.border}` }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-full group-hover:scale-110 transition-transform duration-300"
                style={{ background: '#fff', border: `1px solid ${c.tile.border}` }}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: c.tile.icon }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                </svg>
              </div>
              <div className="text-center min-w-0">
                <p
                  className="text-[18px] sm:text-[28px] tabular-nums truncate leading-none"
                  style={{ color: c.tile.valueColor, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}
                  title={formatPrice(c.value ?? 0)}
                >
                  {formatPrice(c.value ?? 0)}
                </p>
                <p className="text-[9px] sm:text-xs font-medium mt-1 sm:mt-2 tracking-wide" style={{ color: c.tile.icon, fontFamily: 'Raleway, sans-serif' }}>
                  {c.label}
                </p>
                <p className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 tracking-wide hidden sm:block" style={{ color: c.tile.icon, fontFamily: 'Raleway, sans-serif', opacity: 0.7 }}>
                  {t('admin.fromConfirmed')}
                </p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </Card>

      {/* ── Bottom section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Best sellers */}
        <Card className="lg:col-span-2">
          <SectionHeader title={t('admin.bestSellers')} linkTo="/admin/products" linkLabel={t('admin.viewAll')} />
          <div>
            {stats.bestSellers?.length > 0
              ? stats.bestSellers.map((item, idx) => (
                  <BestSellerRow key={item.productId} item={item} rank={idx} />
                ))
              : (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#FDF0F2', border: '1px solid #EDD8DC' }}>
                    <svg className="w-7 h-7" style={{ color: '#DFA3AD' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: '#C4A0A6', fontFamily: 'Raleway, sans-serif' }}>{t('admin.noSalesData')}</p>
                </div>
              )
            }
          </div>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">

          {/* Quick actions */}
          <Card>
            <SectionHeader title={t('admin.quickActions')} />
            <div className="px-5 py-4 space-y-2">
              <QuickAction to="/admin/products/new" icon="📦" label={t('admin.addProduct')} />
              <QuickAction to="/admin/categories"   icon="🏷️" label={t('admin.manageCategories')} />
              <QuickAction to="/admin/orders"       icon="🚚" label={t('admin.viewAllOrders')} />
              <QuickAction to="/admin/offers"       icon="✂️" label={t('admin.createOffer')} />
            </div>
          </Card>

          {/* Store overview */}
          <Card>
            <SectionHeader title={t('admin.storeOverview')} />
            <div className="px-5 py-3">
              <OverviewRow label={t('admin.totalOrders')}  value={stats.totalOrders} />
              <OverviewRow label={t('admin.ordersToday')}  value={stats.ordersToday} />
              <OverviewRow label={t('admin.pending')}      value={stats.pendingOrders} />
              <OverviewRow label={t('admin.customers')}    value={stats.totalUsers} />
              <OverviewRow label={t('admin.products')}     value={stats.totalProducts} />
              <OverviewRow label={t('admin.lowStock')}     value={stats.lowStockCount} alert={stats.lowStockCount > 0} />
            </div>
          </Card>
        </div>
      </div>
      </div>
    </div>
  )
}
