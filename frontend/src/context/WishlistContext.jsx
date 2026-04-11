import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import * as wishlistApi from '../api/wishlistApi'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)
const GUEST_WISHLIST_KEY = 'guestWishlist'

/* ─── Guest storage helpers ───────────────────────────────────────────── */
function loadGuestWishlist() {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveGuestWishlist(items) {
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore quota / disabled storage */
  }
}

/* ─── Provider ────────────────────────────────────────────────────────── */
export function WishlistProvider({ children }) {
  const { isLoggedIn } = useAuth()
  const [wishlist, setWishlist] = useState(() => loadGuestWishlist())
  const wasLoggedInRef = useRef(isLoggedIn)

  /**
   * Pull the current wishlist from the appropriate store:
   *   - logged in  → backend `/api/wishlist`
   *   - guest      → localStorage
   */
  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      setWishlist(loadGuestWishlist())
      return
    }
    try {
      const { data } = await wishlistApi.getWishlist()
      setWishlist(data.data || [])
    } catch {
      setWishlist([])
    }
  }, [isLoggedIn])

  /**
   * On every mount and on every auth-state change:
   *   - On a guest → logged-in transition, merge the local guest wishlist
   *     into the server wishlist (skipping duplicates), then clear local
   *     storage and refresh from the server.
   *   - On any other run, just refresh from the appropriate store.
   */
  useEffect(() => {
    const wasLoggedIn = wasLoggedInRef.current
    wasLoggedInRef.current = isLoggedIn

    const justLoggedIn = !wasLoggedIn && isLoggedIn
    if (!justLoggedIn) {
      fetchWishlist()
      return
    }

    let cancelled = false
    ;(async () => {
      const guestItems = loadGuestWishlist()
      if (guestItems.length === 0) {
        if (!cancelled) await fetchWishlist()
        return
      }
      try {
        const { data } = await wishlistApi.getWishlist()
        const serverIds = new Set((data.data || []).map(p => p.id))
        const toAdd = guestItems.filter(p => p && p.id != null && !serverIds.has(p.id))
        // Sequential is fine — the lists are small and avoids hammering the API
        for (const p of toAdd) {
          try { await wishlistApi.addToWishlist(p.id) } catch { /* skip failures */ }
        }
        saveGuestWishlist([])
      } catch {
        /* If the merge GET fails we still try to refresh the visible state */
      }
      if (!cancelled) await fetchWishlist()
    })()

    return () => { cancelled = true }
  }, [isLoggedIn, fetchWishlist])

  /**
   * Cross-tab sync (guest mode only).
   * When the user hearts something in another tab, the browser fires a
   * `storage` event in this one with the new value. We pick it up and
   * refresh the in-memory state so both tabs stay aligned.
   * Only active for guests — logged-in state lives on the server.
   */
  useEffect(() => {
    if (isLoggedIn) return
    const onStorage = (e) => {
      if (e.key === GUEST_WISHLIST_KEY) {
        setWishlist(loadGuestWishlist())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [isLoggedIn])

  /**
   * Add a product to the wishlist.
   *
   * @param {number|string} productId
   * @param {object} [productData] Full product object — required when guest
   *                               so the item can be displayed without an API.
   */
  const addToWishlist = useCallback(async (productId, productData = null) => {
    if (!isLoggedIn) {
      const current = loadGuestWishlist()
      if (current.some(p => p.id === productId)) return
      if (!productData) return // can't store something we can't render later
      const next = [...current, productData]
      saveGuestWishlist(next)
      setWishlist(next)
      return
    }
    await wishlistApi.addToWishlist(productId)
    await fetchWishlist()
  }, [isLoggedIn, fetchWishlist])

  const removeFromWishlist = useCallback(async (productId) => {
    if (!isLoggedIn) {
      const next = loadGuestWishlist().filter(p => p.id !== productId)
      saveGuestWishlist(next)
      setWishlist(next)
      return
    }
    await wishlistApi.removeFromWishlist(productId)
    setWishlist(prev => prev.filter(p => p.id !== productId))
  }, [isLoggedIn])

  const isInWishlist = useCallback((productId) => {
    return wishlist.some(p => p.id === productId)
  }, [wishlist])

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider')
  return ctx
}
