/**
 * Tiny module-level pub/sub for "the auth state needs to flip to logged out
 * AND the auth drawer should open" — typically fired by the axios interceptor
 * when a 401 / 403 comes back from the API.
 *
 * Why a bus and not a context call?
 * The axios instance is created at module-load time, outside any React tree,
 * so it can't read from `useAuth()` or `useUI()` directly. Instead, a small
 * bridge component (AuthBusBridge) registers a handler on mount that has
 * captured the React `logout` and `openLogin` callbacks via hooks. Axios just
 * calls `emitForceLogout()` and React handles the rest.
 *
 * Single handler is sufficient — there is exactly one bridge mounted in the
 * StoreLayout. Setting null on unmount cleans up after itself.
 */

let handler = null

export function setForceLogoutHandler(fn) {
  handler = fn
}

export function emitForceLogout() {
  if (typeof handler === 'function') handler()
}
