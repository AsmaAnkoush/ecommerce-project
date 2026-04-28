import api from './axios'

export const getSeasons = () => api.get('/seasons')
export const getAdminSeasons = () => api.get('/seasons/admin')
export const getSeason = (id) => api.get(`/seasons/${id}`)
export const createSeason = (data) => api.post('/seasons', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const updateSeason = (id, data) => api.put(`/seasons/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const deleteSeason = (id) => api.delete(`/seasons/${id}`)
export const toggleSeasonVisibility = (id) => api.patch(`/seasons/${id}/toggle-visibility`)
