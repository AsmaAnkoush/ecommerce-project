import api from './axios'

/**
 * Upload one or more image files.
 * @param {File[]} files
 * @returns {Promise<string[]>} array of URL paths, e.g. ["/uploads/uuid.jpg"]
 */
export const uploadImages = async (files) => {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }
  const res = await api.post('/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data // string[]
}
