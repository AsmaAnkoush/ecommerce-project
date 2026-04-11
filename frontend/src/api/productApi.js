import api from './axios'

export const getProducts = (params) => api.get('/products', { params })
export const getProduct = (id) => api.get(`/products/${id}`)
export const getLatestProducts = () => api.get('/products/latest')
export const getBestSellers = () => api.get('/products/best-sellers')
export const getNewArrivals = () => api.get('/products/new-arrivals')
export const getOnSale = () => api.get('/products/on-sale')
export const getOffers = () => api.get('/products/offers')
export const getSeasonProducts = (season) => api.get(`/products/season/${season}`)
export const searchProducts = (keyword, params) => api.get('/products/search', { params: { keyword, ...params } })
export const getProductsByCategory = (categoryId, params) => api.get(`/products/category/${categoryId}`, { params })

// Admin
export const createProduct = (data) => api.post('/products', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)
export const toggleProductVisibility = (id) => api.patch(`/products/${id}/visibility`)
