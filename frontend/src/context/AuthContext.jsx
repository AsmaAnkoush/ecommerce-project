import { createContext, useContext, useState, useCallback } from 'react'
import * as authApi from '../api/authApi'
import { useToast } from './ToastContext'
import { useLanguage } from './LanguageContext'
import { saveSession, getStoredUser, clearSession } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { toast } = useToast()
  const { t } = useLanguage()
  const [user, setUser] = useState(() => getStoredUser())

  const login = useCallback(async (credentials, rememberMe = false) => {
    const { data } = await authApi.login(credentials)
    const userData = data.data
    saveSession(userData, rememberMe)
    setUser(userData)
    toast(t('auth.loginToast'))
    return userData
  }, [toast, t])

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData)
    const userData = data.data
    saveSession(userData, true)
    setUser(userData)
    toast(t('auth.loginToast'))
    return userData
  }, [toast, t])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    toast(t('auth.logoutToast'))
  }, [toast, t])

  const isAdmin = user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
