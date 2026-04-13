import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import {
  getLatestProducts, getNewArrivals, getBestSellers,
  getOnSale, getSeasonProducts,
  
} from '../api/productApi'
import { getCategories } from '../api/categoryApi'
import ProductCard from '../components/product/ProductCard'
import Spinner from '../components/ui/Spinner'
import useInView from '../hooks/useInView'

/* ═══════════════════════ ICONS ══════════════════════════════════════════ */
const IconDress = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <path d="M9 3l3 2 3-2"/><path d="M7 7l2-4M17 7l-2-4"/>
    <path d="M6 7c2 2 4 3 6 3s4-1 6-3"/><path d="M8 10l-3 11h14l-3-11"/>
  </svg>
)
const IconSkirt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <path d="M6 4h12l-2 16H8L6 4z"/><path d="M9 4l1-2h4l1 2"/>
  </svg>
)
const IconSkirtSet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <path d="M6 4h12"/><path d="M7 8h10"/><path d="M8 12l-2 8h12l-2-8"/>
  </svg>
)
const IconAbaya = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <circle cx="12" cy="4" r="2.2"/><path d="M12 6.2C7.5 6.2 6 9 6 11L5 21h14L18 11C18 9 16.5 6.2 12 6.2Z"/>
    <path d="M6 11 3 9M18 11l3-2"/>
  </svg>
)
const IconHijab = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <circle cx="12" cy="7" r="4"/><path d="M7 7C5 9 4 13 4 16c0 3.5 2 5 4 5.5"/>
    <path d="M17 7c2 2 3 6 3 9-0 3.5-2 5-4 5.5"/><path d="M8.5 7Q10 5 12 5"/>
  </svg>
)
const IconAccessories = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/>
  </svg>
)
const IconDefault = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <path d="M20.4 18H3.6L12 9l8.4 9z"/><path d="M12 9V4"/><path d="M9 4a3 3 0 006 0"/>
  </svg>
)
function CategoryIcon({ name = '' }) {
  const n = name.toLowerCase()
  if (n.includes('dress'))  return <IconDress />
  if (n.includes('skirt set') || n.includes('set')) return <IconSkirtSet />
  if (n.includes('skirt'))  return <IconSkirt />
  if (n.includes('abaya'))  return <IconAbaya />
  if (n.includes('hijab') || n.includes('scarf')) return <IconHijab />
  if (n.includes('access') || n.includes('bag') || n.includes('jewel')) return <IconAccessories />
  return <IconDefault />
}
const FALLBACK_CATEGORIES = [
  { id: 'dresses', name: 'Dresses', icon: <IconDress /> },
  { id: 'abayas', name: 'Abayas', icon: <IconAbaya /> },
  { id: 'hijabs', name: 'Hijabs', icon: <IconHijab /> },
  { id: 'accessories', name: 'Accessories', icon: <IconAccessories /> },
]

/* ═══════════════════════ REUSABLE PARTS ═════════════════════════════════ */

function SectionTitle({ eyebrow, title, subtitle, accent = '#DFA3AD', animClass = '', align = 'center' }) {
  const textAlign = align === 'center' ? 'text-center' : 'text-start'
  const justifyDot = align === 'center' ? 'justify-center' : 'justify-start'
  return (
    <div className={`${textAlign} ${animClass}`}>
      {eyebrow && (
        <p className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-2"
           style={{ color: accent, fontFamily: 'Raleway, sans-serif' }}>{eyebrow}</p>
      )}
      <h2 style={{
        fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
        fontSize: 'clamp(24px, 3.5vw, 42px)', color: '#3D1A1E',
        letterSpacing: '0.015em', lineHeight: 1.15, fontWeight: 500,
      }}>{title}</h2>
      {subtitle && (
        <p className="text-[12px] sm:text-[13px] text-[#9B7B80] font-light mt-2 tracking-wide max-w-sm mx-auto"
           style={align !== 'center' ? { marginInlineStart: 0 } : undefined}>{subtitle}</p>
      )}
      <div className={`flex items-center gap-3 mt-4 ${justifyDot}`}>
        <div className="h-px w-10 sm:w-14" style={{ background: accent, opacity: 0.4 }} />
        <span className="text-[9px]" style={{ color: accent }}>✦</span>
        <div className="h-px w-10 sm:w-14" style={{ background: accent, opacity: 0.4 }} />
      </div>
    </div>
  )
}

function ProductGrid({ products, inView, limit = 4, linkTo, linkLabel, cols = 4 }) {
  if (!products.length) return null
  const colClass = cols === 3
    ? 'grid-cols-2 sm:grid-cols-3'
    : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
  return (
    <>
      <div className={`grid ${colClass} gap-3 sm:gap-4 lg:gap-5 mt-8 sm:mt-10`}>
        {products.slice(0, limit).map((p, i) => (
          <div key={p.id}
               className={inView ? 'animate-fade-in-up' : 'opacity-0'}
               style={{ animationDelay: `${i * 65}ms` }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {linkTo && linkLabel && (
        <div className={`text-center mt-8 ${inView ? 'animate-fade-in delay-500' : 'opacity-0'}`}>
          <Link to={linkTo}
                className="inline-flex items-center gap-2 border border-[#DFA3AD] text-[#6B1F2A] text-[11px] tracking-[0.15em] uppercase
                           px-8 py-2.5 rounded-full font-medium hover:bg-[#6B1F2A] hover:text-white hover:border-[#6B1F2A]
                           hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            {linkLabel}
            <svg className="w-3 h-3 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
        </div>
      )}
    </>
  )
}

function Divider({ className = '' }) {
  const [ref, inView] = useInView()
  return (
    <div className={`flex items-center gap-3 px-8 max-w-5xl mx-auto my-3 ${className}`} ref={ref}>
      <div className={`flex-1 h-px bg-[#E8B7BF] origin-left ${inView ? 'animate-draw-line' : 'scale-x-0'}`} />
      <span className={`text-[#DFA3AD] text-[9px] ${inView ? 'animate-fade-in delay-400' : 'opacity-0'}`}>✦</span>
      <div className={`flex-1 h-px bg-[#E8B7BF] origin-right ${inView ? 'animate-draw-line delay-200' : 'scale-x-0'}`} />
    </div>
  )
}

/* ═══════════════════════ SEASON CONFIG ══════════════════════════════════ */
const SEASON = {
  SUMMER: {
    eyebrow: 'home.summerEyebrow', title: 'home.summerTitle', desc: 'home.summerDesc',
    accent: '#C9852A', param: 'SUMMER', viewBtn: 'home.viewSummerCollection', icon: '☀️',
    bg: 'linear-gradient(180deg, transparent 0%, rgba(255,248,230,0.5) 30%, rgba(255,248,230,0.5) 70%, transparent 100%)',
    cardBg: 'linear-gradient(135deg, #FFF8E6 0%, #FFEFC2 50%, #FFE8A8 100%)',
    cardBorder: '#F5D980', cardText: '#7A5C00',
  },
  WINTER: {
    eyebrow: 'home.winterEyebrow', title: 'home.winterTitle', desc: 'home.winterDesc',
    accent: '#4A6C9B', param: 'WINTER', viewBtn: 'home.viewWinterCollection', icon: '❄️',
    bg: 'linear-gradient(180deg, transparent 0%, rgba(230,238,252,0.5) 30%, rgba(230,238,252,0.5) 70%, transparent 100%)',
    cardBg: 'linear-gradient(135deg, #E8EFF8 0%, #D6E2F0 50%, #C4D5E8 100%)',
    cardBorder: '#9BB5D4', cardText: '#2C4A6B',
  },
}

/* ═══════════════════════ SECTION COMPONENTS ═════════════════════════════ */

/* ── Hero ────────────────────────────────────────────────────────────── */
function Hero({ innerRef, inView, t }) {
  return (
    <section className="px-3 sm:px-6 pt-4 pb-2 max-w-5xl mx-auto" ref={innerRef}>
      <div
        className={`relative rounded-[24px] overflow-hidden min-h-[340px] sm:min-h-[420px] lg:min-h-[500px] xl:min-h-[540px]
          ${inView ? 'animate-fade-in-scale' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(130deg, #F0C8D0 0%, #E8B4BF 35%, #DCAAB4 70%, #D4A0AC 100%)' }}
      >
        {/* ── Brand typography ── */}
        <div className="absolute bottom-6 sm:bottom-10 left-5 sm:left-9 z-10 max-w-[58%]">

          {/* "I" — massive display letter */}
          <div className="flex items-end" style={{ lineHeight: 0.78 }}>
            <span
              className={`${inView ? 'animate-hero-letter' : 'opacity-0'} animate-hero-glow select-none`}
              style={{
                fontFamily: '"Playfair Display", "Cormorant Garamond", serif',
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: 'clamp(110px, 20vw, 260px)',
                lineHeight: 0.78,
                color: '#fff',
                letterSpacing: '-.03em',
                textShadow: '0 8px 50px rgba(84,22,31,.25), 0 2px 10px rgba(255,255,255,.15)',
              }}
            >I</span>

            {/* "wear" — elegant flowing serif */}
            <span
              className={`${inView ? 'animate-hero-letter' : 'opacity-0'}`}
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontWeight: 300,
                fontStyle: 'italic',
                fontSize: 'clamp(60px, 11vw, 145px)',
                lineHeight: 0.85,
                letterSpacing: '.06em',
                marginInlineStart: '-0.02em',
                paddingBottom: 'clamp(4px, 0.8vw, 10px)',
                background: 'linear-gradient(180deg, rgba(92,30,46,0.85) 0%, rgba(92,30,46,0.55) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animationDelay: '0.15s',
              }}
            >wear</span>
          </div>

          {/* Decorative thin line between brand & tagline */}
          <div className={`flex items-center gap-2.5 mt-3 mb-2 ${inView ? 'animate-fade-in delay-400' : 'opacity-0'}`}>
            <div className="h-px w-8 sm:w-12" style={{ background: 'rgba(255,255,255,0.5)' }} />
            <span className="text-[8px] tracking-[0.4em] uppercase text-white/50"
                  style={{ fontFamily: 'Raleway, sans-serif' }}>boutique</span>
            <div className="h-px w-8 sm:w-12" style={{ background: 'rgba(255,255,255,0.5)' }} />
          </div>

          {/* "by arrej" — refined script-style */}
          <p className={`text-[15px] sm:text-[18px] lg:text-[22px] ${inView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`}
             style={{
               fontFamily: '"Playfair Display", serif',
               fontStyle: 'italic',
               fontWeight: 400,
               color: 'rgba(255,255,255,0.9)',
               letterSpacing: '0.04em',
             }}>
            {t('home.byArrej')}
          </p>

          {/* CTA */}
          <Link to="/products"
            className={`mt-5 sm:mt-6 inline-flex items-center gap-2.5
              bg-white/15 backdrop-blur-md text-white border border-white/30
              text-[10px] tracking-[0.22em] uppercase px-6 py-3 rounded-full
              hover:bg-white hover:text-[#6B1F2A] hover:border-white
              hover:shadow-[0_8px_32px_rgba(107,31,42,0.25)] hover:-translate-y-0.5
              transition-all duration-400
              ${inView ? 'animate-fade-in-up delay-500' : 'opacity-0'}`}
            style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 600 }}>
            {t('home.shopNow')}
            <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
        </div>

        {/* ── Hero image ── */}
        <div className={`absolute right-0 top-0 h-full w-[52%] sm:w-[50%] ${inView ? 'animate-fade-in delay-100' : 'opacity-0'}`}>
          <img src="/images/hero-dress.jpg" alt="featured dress" className="h-full w-full object-cover object-top" />
        </div>

        {/* ── Gradient overlays ── */}
        <div className="absolute inset-0 z-[5] pointer-events-none"
             style={{ background: 'linear-gradient(to right, rgba(240,200,208,0.98) 20%, rgba(240,200,208,0.7) 42%, rgba(240,200,208,0.2) 62%, transparent 78%)' }} />
        <div className="absolute bottom-0 inset-x-0 h-28 z-[5] pointer-events-none"
             style={{ background: 'linear-gradient(to top, rgba(200,160,170,0.4), transparent)' }} />
        {/* Subtle top vignette for depth */}
        <div className="absolute top-0 inset-x-0 h-20 z-[5] pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, rgba(180,140,150,0.15), transparent)' }} />
      </div>
    </section>
  )
}

/* ── Best Sellers (staggered layout) ─────────────────────────────────── */
function BestSellersSection({ products, innerRef, inView, t }) {
  if (!products.length) return null
  const featured = products[0]
  const rest = products.slice(1, 5)

  return (
    <section className="px-4 sm:px-6 py-10 max-w-5xl mx-auto" ref={innerRef}>
      <SectionTitle
        eyebrow={t('home.bestSellersEyebrow')}
        title={t('home.bestSellers')}
        subtitle={t('home.bestSellersDesc')}
        accent="#C4768B"
        animClass={inView ? 'animate-fade-in-up' : 'opacity-0'}
      />
      <div className="mt-8 sm:mt-10 grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Featured large card */}
        <div className={`col-span-2 lg:col-span-5 lg:row-span-2 ${inView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <ProductCard product={featured} />
        </div>
        {/* Smaller cards */}
        {rest.map((p, i) => (
          <div key={p.id}
               className={`lg:col-span-${i < 2 ? '3' : '4'} col-span-1 ${inView ? 'animate-fade-in-up' : 'opacity-0'}`}
               style={{ animationDelay: `${(i + 1) * 80}ms` }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <div className={`text-center mt-8 ${inView ? 'animate-fade-in delay-500' : 'opacity-0'}`}>
        <Link to="/products?bestSeller=true"
              className="inline-flex items-center gap-2 border border-[#DFA3AD] text-[#6B1F2A] text-[11px] tracking-[0.15em] uppercase
                         px-8 py-2.5 rounded-full font-medium hover:bg-[#6B1F2A] hover:text-white hover:border-[#6B1F2A]
                         hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          {t('home.viewAll')}
          <svg className="w-3 h-3 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </Link>
      </div>
    </section>
  )
}

/* ── Season Section ──────────────────────────────────────────────────── */
function SeasonSection({ products, seasonKey, loading, innerRef, inView, t }) {
  const cfg = SEASON[seasonKey]
  if (!cfg || (!loading && !products.length)) return null
  return (
    <>
      <section className="px-4 sm:px-6 py-10 max-w-5xl mx-auto" style={{ background: cfg.bg }} ref={innerRef}>
        <SectionTitle eyebrow={t(cfg.eyebrow)} title={t(cfg.title)} subtitle={t(cfg.desc)}
          accent={cfg.accent} animClass={inView ? 'animate-fade-in-up' : 'opacity-0'} />
        {loading
          ? <div className="flex justify-center py-14"><Spinner size="lg" /></div>
          : <ProductGrid products={products} inView={inView} limit={8}
              linkTo={`/products?season=${cfg.param}`} linkLabel={t('home.viewAll')} />
        }
      </section>
      <Divider />
    </>
  )
}

/* ── Opposite Season Card ────────────────────────────────────────────── */
function AltSeasonCard({ products, seasonKey, innerRef, inView, t }) {
  const cfg = SEASON[seasonKey]
  if (!cfg || !products.length) return null
  return (
    <section className="px-4 sm:px-6 py-8 max-w-5xl mx-auto" ref={innerRef}>
      <div className={`relative rounded-2xl overflow-hidden ${inView ? 'animate-fade-in-scale' : 'opacity-0'}`}
           style={{ background: cfg.cardBg, border: `1px solid ${cfg.cardBorder}` }}>
        {/* Decorative icon */}
        <div className="absolute top-4 end-4 opacity-15 pointer-events-none text-5xl">{cfg.icon}</div>

        <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase font-semibold mb-1.5"
                 style={{ color: cfg.accent, fontFamily: 'Raleway, sans-serif' }}>{t('home.alsoDiscover')}</p>
              <h3 className="text-[22px] sm:text-[26px] font-light leading-tight"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: cfg.cardText }}>
                {t(cfg.title)}
              </h3>
              <p className="text-xs mt-1 font-light tracking-wide" style={{ color: cfg.accent, opacity: 0.8 }}>
                {t(cfg.desc)}
              </p>
            </div>
            <Link to={`/products?season=${cfg.param}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-medium tracking-[0.12em] uppercase
                transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 shrink-0"
              style={{ background: cfg.accent, color: '#fff', fontFamily: 'Raleway, sans-serif' }}>
              {t(cfg.viewBtn)}
              <svg className="w-3 h-3 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.slice(0, 4).map((p, i) => (
              <div key={p.id} className={inView ? 'animate-fade-in-up' : 'opacity-0'}
                   style={{ animationDelay: `${200 + i * 70}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Special Offers Banner ───────────────────────────────────────────── */
function OffersBanner({ products, innerRef, inView, t }) {
  if (!products.length) return null
  return (
    <section className="px-4 sm:px-6 py-8 max-w-5xl mx-auto" ref={innerRef}>
      <div className={`relative overflow-hidden rounded-2xl ${inView ? 'animate-fade-in-scale' : 'opacity-0'}`}
           style={{ background: 'linear-gradient(135deg, #F7DCE0 0%, #EFC8CF 50%, #E8B7BF 100%)' }}>
        <div className="px-6 py-7 sm:px-10 sm:py-9 lg:px-14 lg:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
            <div className="flex-1">
              <span className="inline-block bg-[#6B1F2A] text-white text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-3"
                    style={{ fontFamily: 'Raleway, sans-serif' }}>{t('home.limitedTime')}</span>
              <h2 className="text-[24px] sm:text-[30px] lg:text-[38px] font-semibold text-[#3D1A1E] leading-tight"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>{t('home.specialOffers')}</h2>
              <p className="text-[12px] sm:text-sm text-[#9B7B80] font-light mt-2 max-w-xs">{t('home.onSaleDesc')}</p>
              <Link to="/products?sale=true"
                className="mt-5 inline-block bg-[#6B1F2A] text-white text-[11px] tracking-widest uppercase px-7 py-2.5 rounded-lg
                  hover:bg-[#8B2535] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                {t('home.shopSale')}
              </Link>
            </div>
            {/* Mini thumbnails */}
            <div className="flex gap-2 sm:gap-3 shrink-0">
              {products.slice(0, 3).map(p => {
                const pct = p.discountPrice ? Math.round((1 - p.discountPrice / p.price) * 100) : 0
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="relative group">
                    <div className="w-[72px] h-[90px] sm:w-20 sm:h-24 lg:w-24 lg:h-28 rounded-xl overflow-hidden bg-white/60 shadow-sm">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full bg-[#EDD8DC]" />}
                    </div>
                    {pct > 0 && (
                      <span className="absolute -top-1.5 -end-1.5 bg-[#6B1F2A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">-{pct}%</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
        {/* Decorative dots */}
        <div className="absolute top-3 end-3 opacity-15 pointer-events-none">
          <svg viewBox="0 0 60 60" className="w-16 h-16 text-[#6B1F2A]">
            {[0,1,2,3].map(r => [0,1,2,3].map(c => (
              <circle key={`${r}-${c}`} cx={c*15+7} cy={r*15+7} r="2" fill="currentColor"/>
            )))}
          </svg>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════ HOME PAGE ══════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { activeSeason } = useSiteSettings()

  const [latest, setLatest] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [onSale, setOnSale] = useState([])
  const [categories, setCategories] = useState([])
  const [summerProducts, setSummerProducts] = useState([])
  const [winterProducts, setWinterProducts] = useState([])
  const [allSeasonProducts, setAllSeasonProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')

  const [heroRef, heroInView] = useInView()
  const [arrivalsRef, arrivalsInView] = useInView()
  const [bestRef, bestInView] = useInView()
  const [mainSeasonRef, mainSeasonInView] = useInView()
  const [allSeasonRef, allSeasonInView] = useInView()
  const [catRef, catInView] = useInView()
  const [offersRef, offersInView] = useInView()
  const [altRef, altInView] = useInView()

  useEffect(() => {
    Promise.all([
      getLatestProducts(), getNewArrivals(), getCategories(), getBestSellers(),
      getOnSale(), getSeasonProducts('SUMMER'), getSeasonProducts('WINTER'), getSeasonProducts('ALL_SEASON'),
    ]).then(([latR, newR, catR, bestR, saleR, sumR, winR, allR]) => {
      setLatest(latR.data?.data ?? [])
      setNewArrivals(newR.data?.data ?? [])
      setCategories(catR.data?.data ?? [])
      setBestSellers(bestR.data?.data ?? [])
      setOnSale(saleR.data?.data ?? [])
      setSummerProducts(sumR.data?.data ?? [])
      setWinterProducts(winR.data?.data ?? [])
      setAllSeasonProducts(allR.data?.data ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(searchQ.trim() ? `/products?search=${encodeURIComponent(searchQ.trim())}` : '/products')
  }

  const displayCategories = categories.length > 0
    ? categories.map(c => ({ ...c, icon: <CategoryIcon name={c.name} /> }))
    : FALLBACK_CATEGORIES
  const arrivals = newArrivals.length > 0 ? newArrivals : latest

  /* Season logic */
  const mainSeason = activeSeason === 'WINTER' ? 'WINTER' : 'SUMMER'
  const altSeason = mainSeason === 'SUMMER' ? 'WINTER' : 'SUMMER'
  const mainProducts = mainSeason === 'SUMMER' ? summerProducts : winterProducts
  const altProducts = altSeason === 'SUMMER' ? summerProducts : winterProducts

  return (
    <div className="bg-[#FDF6F7] pb-16">

      {/* ═══ SEARCH ═══ */}
      <div className="bg-white px-4 sm:px-6 py-3 border-b border-[#F9E8EB]">
        <form onSubmit={handleSearch} className="max-w-lg lg:max-w-2xl mx-auto">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-[#EDD8DC] bg-[#FDF6F7]"
               style={{ boxShadow: '0 1px 4px rgba(107,31,42,0.05)' }}>
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder={t('search.placeholder')}
              className="flex-1 bg-transparent text-[12.5px] text-[#3D1A1E] placeholder-[#C4A8AE] outline-none"
              style={{ fontFamily: 'Raleway, sans-serif' }} />
            <button type="submit" className="text-[#C4A0A6] hover:text-[#6B1F2A] transition-colors" aria-label="Search">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* ═══ HERO ═══ */}
      <Hero innerRef={heroRef} inView={heroInView} t={t} />

      <Divider />

      {/* ═══ NEW ARRIVALS ═══ */}
      <section className="px-4 sm:px-6 py-10 max-w-5xl mx-auto" ref={arrivalsRef}>
        <SectionTitle eyebrow={t('home.newArrivalsEyebrow')} title={t('home.newArrivalsTitle')}
          subtitle={t('home.newArrivalsDesc')} accent="#DFA3AD"
          animClass={arrivalsInView ? 'animate-fade-in-up' : 'opacity-0'} />
        {loading
          ? <div className="flex justify-center py-14"><Spinner size="lg" /></div>
          : arrivals.length === 0
            ? <p className="text-center py-12 text-[#9B7B80] text-sm font-light tracking-wider">{t('home.noProducts')}</p>
            : <ProductGrid products={arrivals} inView={arrivalsInView} limit={8}
                linkTo="/products" linkLabel={t('home.viewAll')} />
        }
      </section>

      {/* ═══ BEST SELLERS ═══ */}
      {bestSellers.length > 0 && (
        <>
          <Divider />
          <BestSellersSection products={bestSellers} innerRef={bestRef} inView={bestInView} t={t} />
        </>
      )}

      <Divider />

      {/* ═══ MAIN SEASON ═══ */}
      {(loading || mainProducts.length > 0) && (
        <SeasonSection products={mainProducts} seasonKey={mainSeason} loading={loading}
          innerRef={mainSeasonRef} inView={mainSeasonInView} t={t} />
      )}

      {/* ═══ ALL SEASON ═══ */}
      {(loading || allSeasonProducts.length > 0) && (
        <>
          <section className="px-4 sm:px-6 py-10 max-w-5xl mx-auto" ref={allSeasonRef}>
            <SectionTitle eyebrow={t('home.allSeasonEyebrow')} title={t('home.allSeasonTitle')}
              subtitle={t('home.allSeasonDesc')} accent="#C4768B"
              animClass={allSeasonInView ? 'animate-fade-in-up' : 'opacity-0'} />
            {loading
              ? <div className="flex justify-center py-14"><Spinner size="lg" /></div>
              : <ProductGrid products={allSeasonProducts} inView={allSeasonInView} limit={4}
                  linkTo="/products?season=ALL_SEASON" linkLabel={t('home.viewAll')} />
            }
          </section>
          <Divider />
        </>
      )}

      {/* ═══ CATEGORIES ═══ */}
      <section className="pt-8 pb-10 px-4 sm:px-6" ref={catRef}>
        <h2 className={`text-center mb-7 lg:mb-9 ${catInView ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                     fontSize: 'clamp(22px, 3vw, 32px)', color: '#6B1F2A', letterSpacing: '0.04em' }}>
          {t('home.shopByCategory')}
        </h2>
        <div className={`grid gap-4 sm:gap-5 lg:gap-6 max-w-5xl mx-auto ${
          displayCategories.length <= 3 ? 'grid-cols-3' :
          displayCategories.length === 4 ? 'grid-cols-4' :
          displayCategories.length === 5 ? 'grid-cols-5' : 'grid-cols-3 sm:grid-cols-6'
        }`}>
          {displayCategories.map((cat, i) => (
            <Link key={cat.id}
              to={typeof cat.id === 'number' ? `/products?category=${cat.id}` : `/products?search=${cat.name}`}
              className={`flex flex-col items-center gap-2.5 group ${catInView ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${100 + i * 80}ms` }}>
              <div className="w-[56px] h-[56px] sm:w-[66px] sm:h-[66px] lg:w-20 lg:h-20 xl:w-[90px] xl:h-[90px]
                rounded-full overflow-hidden flex items-center justify-center text-[#C4768B]
                transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-[#DFA3AD]/30"
                style={{ background: 'linear-gradient(135deg, #FDF0F2 0%, #F7E0E5 100%)', border: '1px solid #EDD8DC' }}>
                {cat.imageUrl
                  ? <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                  : <span className="[&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-7 sm:[&>svg]:h-7 lg:[&>svg]:w-8 lg:[&>svg]:h-8">{cat.icon}</span>
                }
              </div>
              <span className="text-[11px] sm:text-[12px] lg:text-sm text-[#6B3840] text-center leading-tight tracking-wide
                group-hover:text-[#6B1F2A] transition-colors" style={{ fontFamily: 'Raleway, sans-serif' }}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ SPECIAL OFFERS ═══ */}
      {onSale.length > 0 && (
        <>
          <Divider />
          <OffersBanner products={onSale} innerRef={offersRef} inView={offersInView} t={t} />
        </>
      )}

      {/* ═══ OPPOSITE SEASON ═══ */}
      {altProducts.length > 0 && (
        <>
          <Divider />
          <AltSeasonCard products={altProducts} seasonKey={altSeason} innerRef={altRef} inView={altInView} t={t} />
        </>
      )}

      {/* ═══ CTA BANNER ═══ */}
      <div className="px-4 sm:px-6 mt-6 max-w-5xl mx-auto">
        <div className="rounded-2xl overflow-hidden relative"
             style={{ background: 'linear-gradient(135deg, #6B1F2A 0%, #8B2535 50%, #6B1F2A 100%)' }}>
          {/* Decorative glow */}
          <div className="absolute inset-0 pointer-events-none opacity-20"
               style={{ background: 'radial-gradient(circle at 30% 50%, #DFA3AD, transparent 60%)' }} />
          <div className="px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16 text-center relative z-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#EDD8DC]/70 mb-3"
               style={{ fontFamily: 'Raleway, sans-serif' }}>{t('home.ctaEyebrow')}</p>
            <h2 className="text-[22px] sm:text-[30px] lg:text-[38px] font-light text-white tracking-widest mb-2"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}>{t('home.ctaTitle')}</h2>
            <p className="text-[#F9C8CF] text-xs sm:text-sm font-light tracking-wider mb-7">{t('home.ctaSubtitle')}</p>
            <Link to="/register"
              className="inline-block bg-white text-[#6B1F2A] text-xs tracking-widest px-9 py-3.5 lg:px-12 rounded-full font-medium
                hover:bg-[#F9E8EB] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              {t('home.joinUs')}
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
