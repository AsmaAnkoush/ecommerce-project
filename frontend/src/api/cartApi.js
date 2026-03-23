import api from './axios'

export const getCart = () => api.get('/cart')
export const addToCart = (data) => api.post('/cart/items', data)
export const updateCartItem = (itemId, quantity) => api.patch(`/cart/items/${itemId}`, null, { params: { quantity } })
export const removeCartItem = (itemId) => api.delete(`/cart/items/${itemId}`)
export const clearCart = () => api.delete('/cart')
