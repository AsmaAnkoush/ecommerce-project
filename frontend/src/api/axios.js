import axios from 'axios'
import { emitForceLogout } from '../utils/authBus'
import { getToken } from '../utils/storage'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token — skip for auth endpoints.
// For multipart requests (FormData), delete the default Content-Type so the
// browser can inject the correct multipart/form-data boundary automatically.
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  const isAuthEndpoint = config.url?.startsWith('/auth')
  const token = getToken()
  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 (or 403 with a stale token), clear auth and pop the auth drawer.
// No more `window.location.href = '/login'` — the React tree handles
// navigation and modal opening via AuthBusBridge.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401 || (status === 403 && getToken())) {
      emitForceLogout()
    }
    return Promise.reject(error)
  }
)

export default api
