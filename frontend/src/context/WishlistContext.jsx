import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as wishlistApi from '../api/wishlistApi'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { isLoggedIn } = useAuth()
  const [wishlist, setWishlist] = useState([])

  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn) { setWishlist([]); return }
    try {
      const { data } = await wishlistApi.getWishlist()
      setWishlist(data.data)
    } catch { setWishlist([]) }
  }, [isLoggedIn])

  useEffect(() => { fetchWishlist() }, [fetchWishlist])

  const addToWishlist = useCallback(async (productId) => {
    await wishlistApi.addToWishlist(productId)
    await fetchWishlist()
  }, [fetchWishlist])

  const removeFromWishlist = useCallback(async (productId) => {
    await wishlistApi.removeFromWishlist(productId)
    setWishlist(prev => prev.filter(p => p.id !== productId))
  }, [])

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
