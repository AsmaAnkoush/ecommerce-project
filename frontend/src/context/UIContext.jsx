import { createContext, useContext, useState, useCallback } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  /* Existing sidebar state — kept for backward compatibility */
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* Auth drawer */
  const [authDrawer, setAuthDrawer] = useState({ open: false, mode: 'login' })
  const openLogin    = useCallback(() => setAuthDrawer({ open: true, mode: 'login' }),    [])
  const openRegister = useCallback(() => setAuthDrawer({ open: true, mode: 'register' }), [])
  const closeAuth    = useCallback(() => setAuthDrawer(prev => ({ ...prev, open: false })), [])

  /* Cart drawer */
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const openCart  = useCallback(() => setCartDrawerOpen(true),  [])
  const closeCart = useCallback(() => setCartDrawerOpen(false), [])

  /* Search overlay */
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch  = useCallback(() => setSearchOpen(true),  [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  /* Quick View modal */
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const openQuickView  = useCallback((product) => setQuickViewProduct(product), [])
  const closeQuickView = useCallback(() => setQuickViewProduct(null), [])

  return (
    <UIContext.Provider
      value={{
        sidebarOpen, setSidebarOpen,
        authDrawer, openLogin, openRegister, closeAuth,
        cartDrawerOpen, openCart, closeCart,
        searchOpen, openSearch, closeSearch,
        quickViewProduct, openQuickView, closeQuickView,
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext)
