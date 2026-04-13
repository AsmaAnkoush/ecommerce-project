import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import * as cartApi from '../api/cartApi'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

const GUEST_CART_KEY = 'guestCart'

function loadGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    if (!raw) return { items: [], totalPrice: 0, totalItems: 0 }
    const items = JSON.parse(raw)
    const totalPrice = items.reduce((s, i) => s + i.subtotal, 0)
    const totalItems = items.reduce((s, i) => s + i.quantity, 0)
    return { items, totalPrice, totalItems }
  } catch {
    return { items: [], totalPrice: 0, totalItems: 0 }
  }
}

function saveGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
}

export function CartProvider({ children }) {
  const { isLoggedIn } = useAuth()
  const [cart, setCart] = useState({ items: [], totalPrice: 0, totalItems: 0 })
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) {
      setCart(loadGuestCart())
      return
    }
    try {
      setLoading(true)
      const { data } = await cartApi.getCart()
      setCart(data.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [isLoggedIn])

  // Track the prior auth state so we can detect a guest → logged-in transition
  // and merge the local guest cart into the server cart exactly once.
  const wasLoggedInRef = useRef(isLoggedIn)
  useEffect(() => {
    const wasLoggedIn = wasLoggedInRef.current
    wasLoggedInRef.current = isLoggedIn

    const justLoggedIn = !wasLoggedIn && isLoggedIn
    if (!justLoggedIn) {
      fetchCart()
      return
    }

    let cancelled = false
    ;(async () => {
      const guest = loadGuestCart()
      if (!guest.items || guest.items.length === 0) {
        if (!cancelled) await fetchCart()
        return
      }
      // Push each guest item to the server. Backend keys cart rows by
      // (productId, size, color), so duplicates merge naturally.
      for (const it of guest.items) {
        try {
          await cartApi.addToCart({
            productId: it.productId,
            quantity:  it.quantity,
            size:      it.size,
            color:     it.color,
          })
        } catch {
          /* skip — out-of-stock / soft-deleted items just won't merge */
        }
      }
      saveGuestCart([])
      if (!cancelled) await fetchCart()
    })()

    return () => { cancelled = true }
  }, [isLoggedIn, fetchCart])

  // productData: { id, name, imageUrl, price, discountPrice } — required for guest mode
  const addToCart = useCallback(async (productId, quantity = 1, productData = null, size = null, color = null) => {
    if (!isLoggedIn) {
      const existing = loadGuestCart()
      const idx = existing.items.findIndex(i =>
        i.productId === productId && i.size === size && i.color === color
      )
      if (idx >= 0) {
        existing.items[idx].quantity += quantity
        existing.items[idx].subtotal = existing.items[idx].unitPrice * existing.items[idx].quantity
      } else if (productData) {
        const unitPrice = Number(productData.discountPrice || productData.price)
        existing.items.push({
          id: productId,
          productId,
          productName: productData.name,
          productImage: productData.imageUrl || null,
          unitPrice,
          quantity,
          subtotal: unitPrice * quantity,
          size,
          color,
        })
      }
      saveGuestCart(existing.items)
      setCart(loadGuestCart())
      return
    }
    const { data } = await cartApi.addToCart({ productId, quantity, size, color })
    setCart(data.data)
  }, [isLoggedIn])

  // Helper: check if a cart item matches the given id (against either id or cartItemId, loose equality)
  const matchesId = (item, id) =>
    // eslint-disable-next-line eqeqeq
    (item.cartItemId != null && item.cartItemId == id) || item.id == id

  const removeItem = useCallback(async (itemId) => {
    console.log('[CartContext] removeItem called with itemId:', itemId, 'type:', typeof itemId)

    if (!isLoggedIn) {
      console.log('[CartContext] Guest mode — removing from localStorage')
      const existing = loadGuestCart()
      const idx = existing.items.findIndex(i => matchesId(i, itemId))
      if (idx >= 0) existing.items.splice(idx, 1)
      saveGuestCart(existing.items)
      setCart(loadGuestCart())
      return
    }

    // Optimistic update — remove from UI immediately
    setCart(prev => {
      const items = prev.items.filter(i => !matchesId(i, itemId))
      console.log('[CartContext] Optimistic update — items remaining:', items.length)
      return {
        items,
        totalPrice: items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0),
        totalItems: items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
      }
    })

    // Fire DELETE API, then sync state with server response (defensively filtered)
    try {
      console.log('[CartContext] Calling DELETE /cart/items/' + itemId)
      const { data } = await cartApi.removeCartItem(itemId)
      console.log('[CartContext] DELETE successful — server cart:', data.data)
      // Defensive filter in case the backend response still contains the item
      const serverCart = data.data || { items: [], totalPrice: 0, totalItems: 0 }
      const cleanItems = (serverCart.items || []).filter(i => !matchesId(i, itemId))
      setCart({
        ...serverCart,
        items: cleanItems,
        totalPrice: cleanItems.reduce((s, i) => s + (Number(i.subtotal) || 0), 0),
        totalItems: cleanItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
      })
    } catch (err) {
      console.error('[CartContext] removeItem API error:', err)
      // Keep optimistic state — do NOT call fetchCart to avoid re-adding stale items
    }
  }, [isLoggedIn])

  const updateItem = useCallback(async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeItem(itemId)
    }
    if (!isLoggedIn) {
      const existing = loadGuestCart()
      const idx = existing.items.findIndex(i => matchesId(i, itemId))
      if (idx >= 0) {
        existing.items[idx].quantity = quantity
        existing.items[idx].subtotal = existing.items[idx].unitPrice * quantity
      }
      saveGuestCart(existing.items)
      setCart(loadGuestCart())
      return
    }
    try {
      const { data } = await cartApi.updateCartItem(itemId, quantity)
      setCart(data.data)
    } catch {
      await fetchCart()
    }
  }, [isLoggedIn, removeItem, fetchCart])

  const clearCart = useCallback(async () => {
    if (!isLoggedIn) {
      saveGuestCart([])
      setCart({ items: [], totalPrice: 0, totalItems: 0 })
      return
    }
    await cartApi.clearCart()
    setCart({ items: [], totalPrice: 0, totalItems: 0 })
  }, [isLoggedIn])

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
