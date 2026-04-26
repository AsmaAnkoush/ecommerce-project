/**
 * Auth storage helpers.
 *
 * "Remember me" → token + user land in localStorage (survives browser close).
 * Session-only  → token + user land in sessionStorage (cleared on tab close).
 * Email          → always in localStorage for auto-fill convenience; never cleared on logout.
 */

const TOKEN_KEY = 'token'
const USER_KEY  = 'user'
const EMAIL_KEY = 'remembered_email'

/** Persist auth data after a successful login. */
export function saveSession(userData, rememberMe) {
  const storage = rememberMe ? localStorage : sessionStorage
  try {
    storage.setItem(TOKEN_KEY, userData.token)
    storage.setItem(USER_KEY, JSON.stringify(userData))
    if (rememberMe) {
      localStorage.setItem(EMAIL_KEY, userData.email ?? '')
    }
  } catch { /* storage unavailable (e.g. private-browsing quota exceeded) */ }
}

/**
 * Return the JWT token, checking sessionStorage first (session-only login)
 * then localStorage (remembered login). Returns null if neither has one.
 */
export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
}

/** Return the stored user object from whichever storage has it, or null. */
export function getStoredUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Return the last remembered email for login auto-fill. Empty string if none. */
export function getRememberedEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

/** Remove auth tokens from both storages. Intentionally keeps EMAIL_KEY for auto-fill. */
export function clearSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch { /* ignore */ }
}
