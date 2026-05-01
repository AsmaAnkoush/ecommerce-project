import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOutOfStockProducts, getLowStockProducts } from '../../api/adminApi'
import Spinner from '../../components/ui/Spinner'
import PageHeader from '../../components/layout/PageHeader'
import { useLanguage } from '../../context/LanguageContext'

// ── Color resolution ───────────────────────────────────────────────────────────
const COLOR_MAP = {
  // single-word
  black: '#1a1a1a', white: '#f9f9f9', red: '#dc2626', blue: '#2563eb',
  green: '#16a34a', yellow: '#fbbf24', orange: '#f97316', purple: '#9333ea',
  pink: '#ec4899', brown: '#92400e', gray: '#6b7280', grey: '#6b7280',
  navy: '#1e3a5f', beige: '#e8d5b7', cream: '#fef9ec', ivory: '#f9f6ee',
  coral: '#fb7185', salmon: '#f87171', turquoise: '#2dd4bf', teal: '#0f766e',
  maroon: '#881337', olive: '#854d0e', gold: '#d97706', silver: '#94a3b8',
  lavender: '#c4b5fd', lilac: '#d8b4fe', mint: '#6ee7b7', rose: '#f43f5e',
  tan: '#b45309', khaki: '#ca8a04', sand: '#d4a574', camel: '#c19a6b',
  nude: '#dba98e', blush: '#fca5a5', copper: '#b45309', burgundy: '#9f1239',
  wine: '#881337', rust: '#c2410c', mustard: '#d97706', charcoal: '#374151',
  indigo: '#4338ca', violet: '#7c3aed', magenta: '#db2777', fuchsia: '#d946ef',
  cyan: '#22d3ee', aqua: '#22d3ee', emerald: '#10b981', lime: '#84cc16',
  lemon: '#fde047', peach: '#fdba74', apricot: '#fb923c', chocolate: '#7c2d12',
  mocha: '#78350f', taupe: '#a8a29e', stone: '#78716c', slate: '#64748b',
  cobalt: '#1d4ed8', sapphire: '#1e40af', champagne: '#f9e4b7', ecru: '#ede0c8',
  ash: '#9ca3af', platinum: '#e5e7eb', plum: '#6b21a8', mauve: '#c084fc',
  eggshell: '#f0ece0', pearl: '#f0ece0',
  // compound names (lowercased, spaces/hyphens stripped)
  navyblue: '#1e3a5f', skyblue: '#38bdf8', babyblue: '#bfdbfe',
  royalblue: '#1d4ed8', cobaltblue: '#1d4ed8', lightblue: '#93c5fd',
  darkblue: '#1e3a8a', deepblue: '#1e3a8a', steelblue: '#3b82f6',
  hotpink: '#f472b6', lightpink: '#fce7f3', babypink: '#fce7f3',
  darkpink: '#be185d', deeppink: '#be185d', blushpink: '#fecdd3',
  rosepink: '#fb7185', dustypink: '#e9a0a0', oldrose: '#c06c84',
  forestgreen: '#166534', emeraldgreen: '#059669', darkgreen: '#14532d',
  lightgreen: '#86efac', mintgreen: '#6ee7b7', sagegreen: '#84cc16',
  olivegreen: '#713f12', bottlegreen: '#166534',
  darkred: '#7f1d1d', deepred: '#7f1d1d', brightred: '#dc2626', brickred: '#991b1b',
  darkgray: '#374151', darkgrey: '#374151', lightgray: '#d1d5db', lightgrey: '#d1d5db',
  smokeygray: '#6b7280', smokeygrey: '#6b7280',
  offwhite: '#f8f5f0', creamwhite: '#fdf8f0', warmwhite: '#fdf8f0', milkywhite: '#f8f5f0',
  darkbrown: '#451a03', lightbrown: '#d97706', chocolatebrown: '#7c2d12',
  darkpurple: '#4c1d95', lightpurple: '#ede9fe', deeppurple: '#4c1d95',
  periwinkle: '#818cf8', burntorange: '#c2410c', terracotta: '#c2410c',
  dustyrose: '#e9a0a0', marigold: '#f59e0b', rosegold: '#d4a0a0',
}

function resolveColor(raw) {
  if (!raw?.trim()) return null
  const trimmed = raw.trim()
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed
  if (/^rgb/i.test(trimmed)) return trimmed
  return COLOR_MAP[trimmed.toLowerCase().replace(/[\s\-_]+/g, '')] ?? null
}

function isLightHex(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex)
  if (!m) return false
  return (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255 > 0.85
}

// ── ColorDot ───────────────────────────────────────────────────────────────────
// Shows a colored circle. Unrecognized color names → neutral gray placeholder.
// color=null/'' → returns null (hidden).
function ColorDot({ color, size = 16 }) {
  if (!color?.trim()) return null
  const bg = resolveColor(color)
  const resolved = bg ?? '#e5e7eb'
  return (
    <span
      title={color}
      className="inline-block rounded-full shrink-0 cursor-default"
      style={{
        width: size,
        height: size,
        backgroundColor: resolved,
        border: `1.5px solid ${bg ? (isLightHex(bg) ? '#9ca3af' : 'rgba(0,0,0,0.15)') : '#9ca3af'}`,
        flexShrink: 0,
      }}
    />
  )
}

// ── Badges ────────────────────────────────────────────────────────────────────
function OutBadge({ label }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
      {label}
    </span>
  )
}
function LowBadge({ qty, label }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
      {qty} {label}
    </span>
  )
}

// ── VariantRow — one line per problematic size/color combo ────────────────────
function VariantRow({ variant: v, t }) {
  const isOut = v.stockQuantity === 0
  return (
    <div className="flex items-center gap-2">
      {/* Color circle — 14 px, tooltip = raw color name */}
      <ColorDot color={v.color} size={14} />

      {/* Size badge */}
      {v.size && (
        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold text-[11px] min-w-[28px] text-center leading-normal">
          {v.size}
        </span>
      )}

      {/* Stock status */}
      {isOut ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100">
          <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
          {t('admin.outOfStockBadge')}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
          <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
          {v.stockQuantity} {t('admin.stockQty')}
        </span>
      )}
    </div>
  )
}

// ── ProductRow ────────────────────────────────────────────────────────────────
function ProductRow({ product, type, t }) {
  const colors = product.variants
    ? [...new Set(product.variants.map(v => v.color).filter(Boolean))]
    : product.color ? [product.color] : []

  const criticalVariants = product.variants?.filter(v => v.stockQuantity === 0) ?? []
  const lowVariants      = product.variants?.filter(v => v.stockQuantity > 0 && v.stockQuantity < 5) ?? []
  const displayVariants  = type === 'out' ? criticalVariants : lowVariants
  const hasVariants      = (product.variants?.length ?? 0) > 0
  const overflow         = displayVariants.length > 8

  return (
    <div className="px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">

        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F5F0EC] shrink-0 border border-gray-100 mt-0.5">
          <img
            src={product.imageUrl || '/images/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-contain"
            onError={e => { e.target.onerror = null; e.target.src = '/images/placeholder-product.jpg' }}
          />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">

          {/* Product name */}
          <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>

          {/* Category + available-color palette */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {product.categoryName && (
              <span className="text-xs text-gray-400">{product.categoryName}</span>
            )}
            {colors.length > 0 && (
              <div className="flex items-center gap-0.5">
                {colors.slice(0, 8).map((c, i) => (
                  <ColorDot key={i} color={c} size={11} />
                ))}
                {colors.length > 8 && (
                  <span className="text-[9px] text-gray-400 ml-0.5">+{colors.length - 8}</span>
                )}
              </div>
            )}
          </div>

          {/* ── Variant breakdown ── */}
          {hasVariants ? (
            displayVariants.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                {displayVariants.slice(0, 8).map((v, i) => (
                  <VariantRow key={i} variant={v} t={t} />
                ))}
                {overflow && (
                  <p className="text-[10px] text-gray-400 pl-4">
                    +{displayVariants.length - 8} more variants
                  </p>
                )}
              </div>
            )
          ) : (
            /* No variants — product-level stock indicator */
            <div className="flex items-center gap-2 mt-2">
              <ColorDot color={product.color} size={14} />
              {type === 'out'
                ? <OutBadge label={t('admin.outOfStockBadge')} />
                : <LowBadge qty={product.stockQuantity} label={t('admin.stockQty')} />
              }
            </div>
          )}
        </div>

        {/* Edit button — stays at top-right */}
        <Link
          to={`/admin/products/${product.id}/edit`}
          className="shrink-0 self-start inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#EDD8DC] text-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {t('admin.manageStock')}
        </Link>
      </div>
    </div>
  )
}

// ── Section ────────────────────────────────────────────────────────────────────
function Section({ title, badgeColor, products, loading, emptyText, type, t }) {
  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden" style={{ borderColor: '#F0DDE0' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#F5EDEF', background: '#FAFAFA' }}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${badgeColor}`} />
          <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
        </div>
        {!loading && products.length > 0 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {products.length}
          </span>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="md" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-sm">{emptyText}</p>
        </div>
      ) : (
        <div>
          {products.map(p => (
            <ProductRow key={p.id} product={p} type={type} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AdminStock() {
  const { t } = useLanguage()

  const [outOfStock, setOutOfStock] = useState([])
  const [lowStock,   setLowStock]   = useState([])
  const [loadingOut, setLoadingOut] = useState(true)
  const [loadingLow, setLoadingLow] = useState(true)

  useEffect(() => {
    getOutOfStockProducts({ size: 100 })
      .then(r => setOutOfStock(r.data?.data?.content ?? []))
      .finally(() => setLoadingOut(false))

    getLowStockProducts({ size: 100 })
      .then(r => setLowStock(r.data?.data?.content ?? []))
      .finally(() => setLoadingLow(false))
  }, [])

  const totalAlerts = outOfStock.length + lowStock.length

  return (
    <div>
      <PageHeader />
      <div className="px-4 sm:px-8 pt-0 pb-10 space-y-6">

        {/* Page title + summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('admin.stockAlerts')}</h1>
            {!loadingOut && !loadingLow && (
              <p className="text-sm text-gray-500 mt-0.5">
                {totalAlerts === 0
                  ? t('admin.noOutOfStock') + ' · ' + t('admin.noLowStock')
                  : `${outOfStock.length} ${t('admin.outOfStockSection').toLowerCase()} · ${lowStock.length} ${t('admin.lowStockSection').toLowerCase()}`
                }
              </p>
            )}
          </div>

          <Link
            to="/admin/products"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl border border-[#EDD8DC] text-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {t('admin.products')}
          </Link>
        </div>

        <Section
          title={t('admin.outOfStockSection')}
          badgeColor="bg-red-500"
          products={outOfStock}
          loading={loadingOut}
          emptyText={t('admin.noOutOfStock')}
          type="out"
          t={t}
        />

        <Section
          title={`${t('admin.lowStockSection')} — ${t('admin.lowStockThreshold')}`}
          badgeColor="bg-amber-400"
          products={lowStock}
          loading={loadingLow}
          emptyText={t('admin.noLowStock')}
          type="low"
          t={t}
        />

      </div>
    </div>
  )
}
