import api from './axios'

export const getShippingZones = () =>
  api.get('/shipping-zones').then(r => r.data.data)
