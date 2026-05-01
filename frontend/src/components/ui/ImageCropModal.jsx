import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { useLanguage } from '../../context/LanguageContext'

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

async function getCroppedFile(imageSrc, pixelCrop, fileName = 'cropped.jpg') {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(new File([blob], fileName, { type: 'image/jpeg' }))
        else reject(new Error('Canvas export returned null'))
      },
      'image/jpeg',
      0.92,
    )
  })
}

/**
 * Instagram-style crop modal: fixed aspect ratio, user controls image
 * via zoom slider and drag-to-pan. No resize handles on the crop box.
 *
 * Props:
 *   imageSrc  — blob URL or remote URL to crop
 *   aspect    — width/height ratio (default 3/4)
 *   onConfirm — (croppedFile: File) => void
 *   onCancel  — () => void
 */
export default function ImageCropModal({ imageSrc, aspect = 3 / 4, onConfirm, onCancel }) {
  const { t } = useLanguage()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [resolvedSrc, setResolvedSrc] = useState(null)
  const [srcLoading, setSrcLoading] = useState(false)

  // Pre-fetch remote images as blob: so canvas.toBlob() is never tainted
  useEffect(() => {
    if (!imageSrc) return
    if (/^(blob:|data:)/.test(imageSrc)) {
      setResolvedSrc(imageSrc)
      return
    }
    let blobUrl = null
    setSrcLoading(true)
    setResolvedSrc(null)
    fetch(imageSrc, { mode: 'cors', credentials: 'omit' })
      .then(r => { if (!r.ok) throw new Error('fetch'); return r.blob() })
      .then(blob => { blobUrl = URL.createObjectURL(blob); setResolvedSrc(blobUrl) })
      .catch(() => setResolvedSrc(imageSrc))
      .finally(() => setSrcLoading(false))
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [imageSrc])

  // position:fixed body scroll lock — most reliable on iOS Safari
  useEffect(() => {
    const scrollY = window.scrollY
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = prev.overflow
      document.body.style.position = prev.position
      document.body.style.top = prev.top
      document.body.style.width = prev.width
      window.scrollTo(0, scrollY)
    }
  }, [])

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels || processing || !resolvedSrc) return
    setProcessing(true)
    try {
      const file = await getCroppedFile(resolvedSrc, croppedAreaPixels)
      onConfirm(file)
    } catch (err) {
      if (err?.name === 'SecurityError' || String(err).toLowerCase().includes('tainted')) {
        alert(
          'Could not crop this image due to browser security restrictions.\n' +
          'Please re-upload the image locally and try again.',
        )
      }
    } finally {
      setProcessing(false)
    }
  }

  const zoomPct = ((zoom - 1) / 2) * 100

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FDF0F2] flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">{t('admin.cropImage')}</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t('common.close')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Crop area ───────────────────────────────────────── */}
      <div
        className="flex-1 min-h-0 relative"
        style={{ background: '#1a1a1a' }}
      >
        {srcLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <svg className="animate-spin w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        {!srcLoading && resolvedSrc && (
          <Cropper
            image={resolvedSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            minZoom={1}
            maxZoom={3}
            zoomSpeed={0.3}
            restrictPosition
            showGrid
            cropShape="rect"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              cropAreaStyle: {
                border: '2px solid rgba(255,255,255,0.85)',
                borderRadius: 8,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              },
            }}
          />
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div
        className="shrink-0 bg-white border-t border-gray-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Zoom slider */}
        <div className="px-4 sm:px-6 pt-3.5 pb-1">
          <div className="flex items-center gap-3">
            {/* Zoom-out icon */}
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M8 11h6" />
            </svg>

            <div className="flex-1 relative h-5 flex items-center">
              <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-none"
                  style={{ width: `${zoomPct}%`, background: '#6B1F2A' }}
                />
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                aria-label={t('admin.zoom')}
                className="relative w-full h-1.5 appearance-none bg-transparent cursor-pointer"
                style={{ accentColor: '#6B1F2A' }}
              />
            </div>

            {/* Zoom-in icon */}
            <svg className="w-4 h-4 text-[#6B1F2A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
            </svg>
          </div>

          <p className="text-center text-[10px] text-gray-400 mt-1.5 tracking-widest uppercase">
            {t('admin.zoom')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-stretch gap-3 px-4 sm:px-5 py-3 sm:py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none sm:px-5 min-h-[48px] py-2.5 text-sm font-semibold text-[#6B1F2A] rounded-xl border-2 border-[#6B1F2A] hover:bg-[#FDF0F2] active:bg-[#F5E0E3] transition-colors flex items-center justify-center"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing || !croppedAreaPixels}
            className="flex-[2] sm:flex-none sm:px-5 min-h-[48px] py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 active:opacity-80 hover:opacity-90 flex items-center justify-center"
            style={{ background: '#6B1F2A' }}
          >
            {processing ? (
              <>
                <svg className="animate-spin w-4 h-4 me-2 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('admin.processing')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 me-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('admin.applyCrop')}
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  )
}
