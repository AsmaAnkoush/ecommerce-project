import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useLanguage } from '../../context/LanguageContext'

/**
 * Draws the cropped region onto a canvas and returns a File.
 */
function getCroppedFile(image, crop, fileName = 'cropped.jpg') {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  const pixelCrop = {
    x: crop.x * scaleX,
    y: crop.y * scaleY,
    width: crop.width * scaleX,
    height: crop.height * scaleY,
  }

  canvas.width  = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  )

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(new File([blob], fileName, { type: 'image/jpeg' }))
          else reject(new Error('Canvas export returned null'))
        },
        'image/jpeg',
        0.92,
      )
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Centers a crop selection covering ~85% of the image at the given aspect ratio.
 */
function centerCrop(mediaWidth, mediaHeight, aspect) {
  let cropWidth, cropHeight

  if (aspect) {
    const mediaAspect = mediaWidth / mediaHeight
    if (mediaAspect > aspect) {
      cropHeight = mediaHeight * 0.85
      cropWidth  = cropHeight * aspect
    } else {
      cropWidth  = mediaWidth * 0.85
      cropHeight = cropWidth / aspect
    }
  } else {
    cropWidth  = mediaWidth  * 0.8
    cropHeight = mediaHeight * 0.8
  }

  return {
    unit: 'px',
    x: (mediaWidth  - cropWidth)  / 2,
    y: (mediaHeight - cropHeight) / 2,
    width:  cropWidth,
    height: cropHeight,
  }
}

/**
 * ImageCropModal
 *
 * Props:
 *   imageSrc  — blob URL or path of the image to crop
 *   aspect    — width/height ratio (default 3/4). Pass null for free crop.
 *   onConfirm — (croppedFile: File) => void
 *   onCancel  — () => void
 *
 * Layout: fixed inset-0 flex flex-col
 *   The outer div is pinned to all four viewport edges via inset-0, so its
 *   height is ALWAYS exactly the visible viewport — no 100dvh/100vh arithmetic,
 *   no JS ref cascade, no -webkit-fill-available guessing.
 *   flex-col + shrink-0 header/footer + flex-1 crop area ensures the footer
 *   is always on-screen regardless of browser chrome or URL bar state.
 *
 * Body scroll lock: uses the position:fixed trick (most reliable on iOS Safari).
 *   Saves scroll position, restores it on unmount.
 */
export default function ImageCropModal({ imageSrc, aspect: initialAspect = 3 / 4, onConfirm, onCancel }) {
  const { t } = useLanguage()
  const [crop, setCrop]             = useState(null)
  const [lockAspect, setLockAspect] = useState(true)
  const [processing, setProcessing] = useState(false)
  const imgRef     = useRef(null)
  const cropAreaRef = useRef(null)
  // Explicit pixel max-dimensions for the img, measured once after mount.
  // Avoids the circular max-height:100% CSS bug where the img's parent height
  // is itself content-determined, causing portrait images to overflow and the
  // crop selection overlay to visually misalign from the image content.
  const [maxImgSize, setMaxImgSize] = useState({ w: 0, h: 0 })

  // Resolved canvas-safe source for the image.
  // Remote URLs are pre-fetched as blob: URLs so canvas.toBlob() never
  // throws a SecurityError due to a tainted canvas. blob: / data: URLs
  // are already canvas-safe and are used directly.
  const [resolvedSrc,     setResolvedSrc]     = useState(null)
  const [srcFetching,     setSrcFetching]     = useState(false)
  const [srcFetchFailed,  setSrcFetchFailed]  = useState(false)

  useLayoutEffect(() => {
    if (!cropAreaRef.current) return
    const { width, height } = cropAreaRef.current.getBoundingClientRect()
    // p-3 = 12px each side (24px total); sm:p-5 = 20px each side (40px total)
    const pad = window.innerWidth >= 640 ? 40 : 24
    setMaxImgSize({ w: Math.max(1, width - pad), h: Math.max(1, height - pad) })
  }, [])

  const activeAspect = lockAspect ? initialAspect : undefined

  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget
    const { width, height } = e.currentTarget
    setCrop(centerCrop(width, height, lockAspect ? initialAspect : null))
  }

  const toggleAspectLock = () => {
    setLockAspect(prev => {
      const next = !prev
      if (imgRef.current) {
        const { width, height } = imgRef.current
        setCrop(centerCrop(width, height, next ? initialAspect : null))
      }
      return next
    })
  }

  // position:fixed body lock — most reliable approach on iOS Safari.
  // Saves and restores scroll position so the page doesn't jump.
  useEffect(() => {
    const scrollY = window.scrollY
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top:      document.body.style.top,
      width:    document.body.style.width,
    }
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top      = `-${scrollY}px`
    document.body.style.width    = '100%'
    return () => {
      document.body.style.overflow = prev.overflow
      document.body.style.position = prev.position
      document.body.style.top      = prev.top
      document.body.style.width    = prev.width
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Fetch remote images as a blob so the canvas is never tainted.
  // Falls back to using imageSrc directly (+ crossOrigin attr) if CORS blocks the fetch.
  useEffect(() => {
    if (!imageSrc) return
    if (/^(blob:|data:)/.test(imageSrc)) {
      setResolvedSrc(imageSrc)
      return
    }
    let blobUrl = null
    setSrcFetching(true)
    setSrcFetchFailed(false)
    setResolvedSrc(null)
    fetch(imageSrc, { mode: 'cors', credentials: 'omit' })
      .then(r => { if (!r.ok) throw new Error('fetch'); return r.blob() })
      .then(blob => { blobUrl = URL.createObjectURL(blob); setResolvedSrc(blobUrl) })
      .catch(() => { setSrcFetchFailed(true); setResolvedSrc(imageSrc) })
      .finally(() => setSrcFetching(false))
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [imageSrc])

  const handleConfirm = async () => {
    if (!imgRef.current || !crop?.width || !crop?.height) return
    setProcessing(true)
    try {
      const file = await getCroppedFile(imgRef.current, crop)
      onConfirm(file)
    } catch (err) {
      if (err?.name === 'SecurityError' || String(err).toLowerCase().includes('tainted')) {
        alert(
          'Could not crop this image due to browser security restrictions.\n' +
          'Please re-upload the image locally and try cropping again.'
        )
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    /*
      fixed inset-0 flex flex-col — the definitive mobile-safe layout.

      inset-0 (top:0 right:0 bottom:0 left:0) pins all four sides to the
      visual viewport. The browser computes height from the constraints
      directly — no unit conversion, no media-query override needed.

      On iOS Safari, fixed elements are always sized to the visual viewport
      (excluding the URL bar), so the footer is ALWAYS visible.
    */
    <div className="fixed inset-0 z-[9999] flex flex-col">

      {/* ── Header ───────────────────────────────────────────────────── */}
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

      {/*
        ── Crop area ───────────────────────────────────────────────────
        flex-1 min-h-0: takes ALL vertical space between header and footer.
        overflow-hidden: clips ReactCrop handles at the boundary.
        touchAction:none on container: lets ReactCrop own all touch events
        (drag selection, resize handles) without browser scroll interference.
        cropAreaRef is measured in useLayoutEffect; maxImgSize provides explicit
        pixel constraints to the img so ReactCrop is never larger than the viewport.
      */}
      <div
        ref={cropAreaRef}
        className="flex-1 min-h-0 relative overflow-hidden"
        style={{ background: '#1a1a1a', touchAction: 'none' }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5">
          {srcFetching && (
            <div className="flex flex-col items-center gap-3 text-white/60">
              <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-xs tracking-wide">Loading image…</span>
            </div>
          )}
          {!srcFetching && resolvedSrc && maxImgSize.w > 0 && (
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              aspect={activeAspect}
              minWidth={40}
              minHeight={40}
              keepSelection
              ruleOfThirds
              className="[&_.ReactCrop__crop-selection]:!border-2 [&_.ReactCrop__crop-selection]:!border-white/80 [&_.ReactCrop__crop-selection]:!rounded-lg"
            >
              <img
                src={resolvedSrc}
                crossOrigin={srcFetchFailed ? 'anonymous' : undefined}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="block select-none"
                style={{
                  maxWidth: maxImgSize.w + 'px',
                  maxHeight: maxImgSize.h + 'px',
                  width: 'auto',
                  height: 'auto',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
                draggable={false}
              />
            </ReactCrop>
          )}
        </div>
      </div>

      {/*
        ── Footer ──────────────────────────────────────────────────────
        shrink-0: never compressed — always visible on-screen.
        env(safe-area-inset-bottom): clears the iPhone home indicator.
      */}
      <div
        className="shrink-0 border-t border-gray-100 bg-white"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Toolbar — aspect lock + pixel readout */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-gray-50/80">
          <button
            type="button"
            onClick={toggleAspectLock}
            className={[
              'flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all min-h-[44px]',
              lockAspect
                ? 'bg-[#6B1F2A] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 active:bg-gray-200',
            ].join(' ')}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {lockAspect ? (
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              )}
            </svg>
            <span className="sm:hidden">{lockAspect ? t('admin.aspectLocked') : t('admin.aspectFree')}</span>
            <span className="hidden sm:inline">{lockAspect ? t('admin.lockedAspect') : t('admin.freeResize')}</span>
          </button>

          {crop?.width > 0 && imgRef.current && (
            <span className="text-[11px] text-gray-400 tabular-nums">
              {Math.round(crop.width  * (imgRef.current.naturalWidth  / imgRef.current.width))}
              {' × '}
              {Math.round(crop.height * (imgRef.current.naturalHeight / imgRef.current.height))}
              {' px'}
            </span>
          )}
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
            disabled={processing || !crop?.width}
            className="flex-[2] sm:flex-none sm:px-5 min-h-[48px] py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 active:opacity-80 hover:opacity-90 flex items-center justify-center"
            style={{ background: '#6B1F2A' }}
          >
            {processing ? (
              <>
                <svg className="animate-spin w-4 h-4 me-2 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
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
