import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'

/**
 * Guards an authenticated (or admin-only) route.
 *
 * Behaviour change vs. the old version: instead of `<Navigate to="/login">`
 * (which used to take the user to the now-removed standalone login page),
 * guests are sent to the home page **and** the auth drawer is popped open
 * via UIContext, so the entire app uses one unified login UI.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoggedIn, isAdmin } = useAuth()
  const { openLogin } = useUI()
  const triggeredRef = useRef(false)

  // Open the auth drawer once when the user is bounced. The ref guards against
  // multiple opens during the redirect render.
  useEffect(() => {
    if (!isLoggedIn && !triggeredRef.current) {
      triggeredRef.current = true
      openLogin()
    }
  }, [isLoggedIn, openLogin])

  if (!isLoggedIn) {
    return <Navigate to="/" replace />
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}
