import api from './axios'

/**
 * Upload one or more image files in a single multipart request.
 *
 * @param {File[]} files
 * @param {(percent: number) => void} [onProgress]  optional 0-100 progress callback
 * @returns {Promise<string[]>} S3 URLs in the same order as `files`
 */
export const uploadImages = async (files, onProgress) => {
  const fileArr = Array.from(files || []).filter(Boolean)
  if (!fileArr.length) return []

  const formData = new FormData()
  fileArr.forEach(file => formData.append('files', file))

  console.log(`[uploadImages] sending ${fileArr.length} file(s)`)

  // Do NOT set Content-Type manually — the browser must add the
  // "; boundary=..." part for multipart/form-data parsing to work.
  const res = await api.post('/upload/images', formData, {
    timeout: 120_000,
    onUploadProgress: onProgress
      ? (evt) => {
          if (evt.total) {
            onProgress(Math.round((evt.loaded * 100) / evt.total))
          }
        }
      : undefined,
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
