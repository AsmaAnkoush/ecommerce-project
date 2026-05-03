import api from './axios'

export const getShippingZones = () =>
  api.get('/shipping-zones').then(r => r.data.data)

export const getAdminShippingZones = () =>
  api.get('/admin/shipping-zones')

export const createShippingZone = (data) =>
  api.post('/admin/shipping-zones', data)

export const updateZonePrice = (id, price) =>
  api.patch(`/admin/shipping-zones/${id}/price`, { price })

export const toggleZoneActive = (id) =>
  api.patch(`/admin/shipping-zones/${id}/toggle`)

export const deleteShippingZone = (id) =>
  api.delete(`/admin/shipping-zones/${id}`)
