import imageCompression from 'browser-image-compression'

const OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg',   // converts HEIC → JPEG automatically
  initialQuality: 0.85,
}

export async function compressImage(file) {
  if (file.size < 300 * 1024) return file  // already small, skip
  try {
    return await imageCompression(file, OPTIONS)
  } catch {
    return file  // compression failed — send original
  }
}
