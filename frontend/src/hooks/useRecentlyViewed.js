import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'recentlyViewed'
const MAX_ITEMS = 12

/**
 * Tracks recently viewed products in localStorage.
 *
 * Usage:
 *   const { recentlyViewed, addViewed } = useRecentlyViewed()
 *   // Call addViewed(product) when a product detail page mounts.
 *   // Read `recentlyViewed` to render a "Recently Viewed" section.
 *
 * Stores the full product object (same shape as ProductCard expects) so the
 * section can render without an extra API round-trip.
 */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch { /* ignore */ }
}

export default function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState(load)

  /* Cross-tab sync (same pattern as guest wishlist) */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setRecentlyViewed(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addViewed = useCallback((product) => {
    if (!product?.id) return
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id)
      const next = [product, ...filtered].slice(0, MAX_ITEMS)
      save(next)
      return next
    })
  }, [])

  return { recentlyViewed, addViewed }
}
