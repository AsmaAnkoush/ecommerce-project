import api from './axios'

export const getAdminProducts = (params) => api.get('/admin/products', { params })
export const getAdminProductById = (id) => api.get(`/admin/products/${id}`)

export const getDashboard = () => api.get('/admin/dashboard')
export const getAdminOrders = (params) => api.get('/admin/orders', { params })
export const getAdminOrder = (id) => api.get(`/admin/orders/${id}`)
export const updateOrderStatus = (id, status) => api.patch(`/admin/orders/${id}/status`, null, { params: { status } })
export const getSettings = () => api.get('/settings')
export const updateSettings = (data) => api.put('/settings', data)

export const getAdminUsers = (params) => api.get('/admin/users', { params })
export const getAdminUser = (id) => api.get(`/admin/users/${id}`)
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`)

export const updateActiveSeason = (season) => api.put('/admin/settings/season', null, { params: { season } })

export const uploadLogo = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/admin/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
