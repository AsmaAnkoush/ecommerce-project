import api from './axios'

export const getNotifications = () => api.get('/admin/notifications')
export const getUnreadCount   = () => api.get('/admin/notifications/unread-count')
export const markAsRead       = (id) => api.put(`/admin/notifications/${id}/read`)
export const markAllAsRead    = () => api.put('/admin/notifications/mark-all-read')
