import api from './axios'

export const getReviews = (productId) => api.get(`/products/${productId}/reviews`)
export const addReview = (productId, data) => api.post(`/products/${productId}/reviews`, data)
export const updateReview = (productId, data) => api.put(`/products/${productId}/reviews`, data)
export const deleteReview = (productId) => api.delete(`/products/${productId}/reviews`)

// Admin
export const getAdminReviews = (params) => api.get('/admin/reviews', { params })
export const approveReview = (id) => api.patch(`/admin/reviews/${id}/approve`)
export const rejectReview  = (id) => api.patch(`/admin/reviews/${id}/reject`)
