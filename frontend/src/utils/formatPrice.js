import { useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'

/**
 * Currency wording per language. Single source of truth — change here to
 * change every price label across the app.
 */
const CURRENCY_LABEL = {
  ar: 'شيكل',
  en: 'ILS',
}

/**
 * Pure formatter — formats a number as a price string.
 *
 * Always renders as an integer with thousand separators followed by the
 * currency word for the requested language.
 *
 * Examples:
 *   formatPrice(120,    'ar') → "120 شيكل"
 *   formatPrice(120,    'en') → "120 ILS"
 *   formatPrice(1200,   'ar') → "1,200 شيكل"
 *   formatPrice(99999,  'en') → "99,999 ILS"
 *   formatPrice(null,   'ar') → "0 شيكل"
 *   formatPrice("250.7","en") → "251 ILS"
 *
 * Non-finite or missing values fall back to 0 so the UI never crashes on a
 * null/undefined price coming from the API.
 *
 * Prefer the `useFormatPrice()` hook inside React components so the display
 * re-renders automatically on language toggle. Use this raw function for
 * non-React contexts or tests.
 *
 * @param {number|string|null|undefined} value
 * @param {'ar'|'en'} [lang='ar']
 * @returns {string}
 */
export function formatPrice(value, lang = 'ar') {
  const n = Number(value)
  const safe = Number.isFinite(n) ? Math.round(n) : 0
  const currency = CURRENCY_LABEL[lang] || CURRENCY_LABEL.ar
  return `${safe.toLocaleString('en-US')} ${currency}`
}

/**
 * React hook — returns a `formatPrice(value)` function pre-bound to the
 * current language from LanguageContext. Components that call this hook
 * automatically re-render when the user switches language, so prices flip
 * from "120 شيكل" to "120 ILS" instantly.
 *
 * Usage:
 *   const formatPrice = useFormatPrice()
 *   …
 *   <span>{formatPrice(product.price)}</span>
 *
 * @returns {(value: number|string|null|undefined) => string}
 */
export function useFormatPrice() {
  const { lang } = useLanguage()
  return useCallback((value) => formatPrice(value, lang), [lang])
}

export default formatPrice
