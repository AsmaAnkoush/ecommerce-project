import api from './axios'

/**
 * Upload one or more image files in a single multipart request.
 *
 * Why the count check: a partial backend failure (e.g. one file rejected by
 * S3) would otherwise return fewer URLs than files and the caller would
 * silently lose images. Throwing here forces the caller to handle it.
 *
 * @param {File[]} files
 * @returns {Promise<string[]>} array of URL paths in the same order as `files`
 */
export const uploadImages = async (files) => {
  const fileArr = Array.from(files || []).filter(Boolean)
  if (!fileArr.length) return []

  const formData = new FormData()
  fileArr.forEach(file => formData.append('files', file))

  console.log(`[uploadImages] sending ${fileArr.length} file(s)`)

  // Do NOT set Content-Type manually — the browser must add the
  // `; boundary=...` part for multipart/form-data parsing to work.
  const res = await api.post('/upload/images', formData, {
    timeout: 120000,
  })

  const urls = res?.data?.data ?? []
  console.log(`[uploadImages] received ${urls.length} URL(s)`)

  if (urls.length !== fileArr.length) {
    throw new Error(
      `Upload count mismatch: sent ${fileArr.length} files, got ${urls.length} URLs`
    )
  }
  return urls
}
