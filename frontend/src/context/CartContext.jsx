import { createContext, useContext, useState, useEffect, useCallback } from 'react'
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

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

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

  const updateItem = useCallback(async (itemId, quantity) => {
    if (!isLoggedIn) {
      const existing = loadGuestCart()
      if (quantity <= 0) {
        existing.items = existing.items.filter(i => i.id !== itemId)
      } else {
        const idx = existing.items.findIndex(i => i.id === itemId)
        if (idx >= 0) {
          existing.items[idx].quantity = quantity
          existing.items[idx].subtotal = existing.items[idx].unitPrice * quantity
        }
      }
      saveGuestCart(existing.items)
      setCart(loadGuestCart())
      return
    }
    const { data } = await cartApi.updateCartItem(itemId, quantity)
    setCart(data.data)
  }, [isLoggedIn])

  const removeItem = useCallback(async (itemId) => {
    if (!isLoggedIn) {
      const existing = loadGuestCart()
      existing.items = existing.items.filter(i => i.id !== itemId)
      saveGuestCart(existing.items)
      setCart(loadGuestCart())
      return
    }
    const { data } = await cartApi.removeCartItem(itemId)
    setCart(data.data)
  }, [isLoggedIn])

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
