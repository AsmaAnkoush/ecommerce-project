import { useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'

/**
 * Format a price as Israeli Shekel (₪).
 *
 * Always renders as "₪ {amount}" with 2 decimal places and thousand separators.
 *
 * Examples:
 *   formatPrice(260)        → "₪ 260.00"
 *   formatPrice(1200.5)     → "₪ 1,200.50"
 *   formatPrice(99999)      → "₪ 99,999.00"
 *   formatPrice(null)       → "₪ 0.00"
 *   formatPrice(undefined)  → "₪ 0.00"
 *   formatPrice("250.7")    → "₪ 250.70"
 *
 * @param {number|string|null|undefined} amount
 * @param {{ showSymbol?: boolean, decimals?: number, fallback?: string }} [options]
 * @returns {string}
 */
export function formatPrice(amount, { showSymbol = true, decimals = 2, fallback = '₪ 0.00' } = {}) {
  if (amount === null || amount === undefined) return fallback
  const n = Number(amount)
  if (!Number.isFinite(n)) return fallback
  const formatted = n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return showSymbol ? `₪ ${formatted}` : formatted
}

/**
 * React hook — returns a `formatPrice(value)` function for use in components.
 * Components using this hook re-render automatically when the user switches
 * language, keeping price labels in sync with the rest of the UI.
 *
 * Usage:
 *   const formatPrice = useFormatPrice()
 *   <span>{formatPrice(product.price)}</span>
 *
 * @returns {(value: number|string|null|undefined) => string}
 */
export function useFormatPrice() {
  const { lang } = useLanguage()
  return useCallback((value, options) => formatPrice(value, options), [lang])
}

export default formatPrice
