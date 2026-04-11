import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useUI } from '../../context/UIContext'
import { setForceLogoutHandler } from '../../utils/authBus'

/**
 * Connects the module-level auth bus to React state.
 *
 * Mounted once at the StoreLayout level. When the axios interceptor (or any
 * other non-React code) calls `emitForceLogout()`, this component:
 *   1. Calls AuthContext.logout() — clears the JWT and user state
 *   2. Calls UIContext.openLogin() — pops the auth drawer
 *
 * Renders nothing.
 */
export default function AuthBusBridge() {
  const { logout } = useAuth()
  const { openLogin } = useUI()

  useEffect(() => {
    setForceLogoutHandler(() => {
      logout()
      openLogin()
    })
    return () => setForceLogoutHandler(null)
  }, [logout, openLogin])

  return null
}
