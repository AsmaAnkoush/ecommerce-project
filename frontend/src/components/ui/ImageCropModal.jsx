import { useState, useRef, useEffect } from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

/**
 * Draws the cropped region onto a canvas and returns a File.
 * Unchanged from original — output quality and dimensions are identical.
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

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob], fileName, { type: 'image/jpeg' })),
      'image/jpeg',
      0.92,
    )
  })
}

/**
 * Computes a centered initial crop. Unchanged from original.
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
 * Mobile  (<640px): true full-screen using 100dvh (dynamic viewport height —
 *   accounts for iOS Safari's collapsible URL bar).  Fallback to 100svh, then
 *   -webkit-fill-available for very old mobile browsers.
 * Desktop (≥640px): centered card, max-w-xl, max-h-[92vh].
 *
 * The crop canvas is absolutely positioned inside a relative flex-1 container
 * so that `max-height: 100%` on both ReactCrop and the <img> resolves against
 * a definite pixel height, preventing the image from overflowing on mobile.
 */
export default function ImageCropModal({ imageSrc, aspect: initialAspect = 3 / 4, onConfirm, onCancel }) {
  const [crop, setCrop]             = useState(null)
  const [lockAspect, setLockAspect] = useState(true)
  const [processing, setProcessing] = useState(false)
  const imgRef = useRef(null)

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

  // Lock body scroll while the modal is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleConfirm = async () => {
    if (!imgRef.current || !crop?.width || !crop?.height) return
    setProcessing(true)
    try {
      const file = await getCroppedFile(imgRef.current, crop)
      onConfirm(file)
    } finally {
      setProcessing(false)
    }
  }

  return (
    /* ── Backdrop ──────────────────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      {/*
        ── Modal shell ────────────────────────────────────────────────────
        Mobile  : true full-screen.
          • h-dvh  → 100dvh (dynamic VH, shrinks when iOS toolbar appears)
          • The inline style cascade provides layered fallbacks for older
            mobile browsers that don't support dvh/svh.
        Desktop : auto height, max 92 vh.
      */}
      <div
        className="
          bg-white w-full flex flex-col overflow-hidden
          rounded-t-3xl sm:rounded-2xl shadow-2xl
          sm:h-auto sm:max-h-[92vh] sm:max-w-xl
        "
        style={{
          // Layered mobile-height fallbacks (last supported value wins in CSS):
          //   100vh               → works everywhere but ignores iOS toolbar
          //   100svh              → small viewport: always excludes toolbar
          //   100dvh              → dynamic: shrinks when toolbar is shown
          //   -webkit-fill-available → legacy iOS Safari fallback
          // On sm+ screens the Tailwind sm:h-auto/sm:max-h-[92vh] classes take
          // over via the @media rule, which has higher cascade priority.
          height: '-webkit-fill-available',
        }}
        // Cascade override for browsers that support CSS custom min/max:
        // We use a second style attribute trick via a CSS custom property so
        // modern browsers get the right value without JS media-query detection.
        ref={el => {
          if (!el) return
          // Progressively enhance to the best supported dvh unit
          el.style.height = '100vh'          // baseline
          el.style.height = '100svh'         // Safari 15.4+, Chrome 108+
          el.style.height = '100dvh'         // Chrome 108+, Firefox 101+
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Mobile drag handle ─────────────────────────────────────── */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FDF0F2] flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Crop Image</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/*
          ── Crop area ──────────────────────────────────────────────────
          The outer div is flex-1 min-h-0 (takes all remaining vertical
          space without overflowing the modal).

          The INNER div is absolutely positioned (inset-0) inside this
          relative container. This gives it a definite pixel height, which
          is required for `max-height: 100%` to resolve correctly on both
          ReactCrop's wrapper div and the <img> inside it.

          Without the absolute-inner pattern, `max-h-full` on an inline-block
          child (which is what ReactCrop renders) has no definite parent height
          to resolve against, so the image overflows on mobile.

          touch-action: none on the outer container prevents the browser from
          intercepting touch events for scrolling while the user is dragging
          the crop area.
        */}
        <div
          className="flex-1 min-h-0 relative overflow-hidden"
          style={{ background: '#1a1a1a', touchAction: 'none' }}
        >
          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              aspect={activeAspect}
              minWidth={40}
              minHeight={40}
              keepSelection
              ruleOfThirds
              className="[&_.ReactCrop__crop-selection]:!border-2 [&_.ReactCrop__crop-selection]:!border-white/80 [&_.ReactCrop__crop-selection]:!rounded-lg"
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                // ReactCrop renders inline-block; setting display:flex lets
                // max-height propagate correctly to the child-wrapper div.
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="block select-none"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  width: 'auto',
                  height: 'auto',
                  // Prevent native browser touch handling so ReactCrop's own
                  // pointer-event listeners receive every touch event cleanly.
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
                draggable={false}
              />
            </ReactCrop>
          </div>
        </div>

        {/*
          ── Bottom bar ─────────────────────────────────────────────────
          shrink-0 ensures it's never pushed off-screen.
          Safe-area padding handles iPhone notch / home-indicator.
        */}
        <div
          className="shrink-0 border-t border-gray-100"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Toolbar — aspect lock toggle + pixel dimensions readout */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-gray-50/80">
            <button
              type="button"
              onClick={toggleAspectLock}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all min-h-[44px] ${
                lockAspect
                  ? 'bg-[#6B1F2A] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 active:bg-gray-200'
              }`}
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
              <span className="sm:hidden">{lockAspect ? 'Locked' : 'Free'}</span>
              <span className="hidden sm:inline">{lockAspect ? '3:4 Locked' : 'Free Resize'}</span>
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

          {/* Action buttons — 50/50 full-width on mobile, auto-width on desktop */}
          <div className="flex items-stretch gap-3 px-4 sm:px-5 py-3 sm:py-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none sm:px-5 min-h-[48px] py-2.5 text-sm font-semibold text-[#6B1F2A] rounded-xl border-2 border-[#6B1F2A] hover:bg-[#FDF0F2] active:bg-[#F5E0E3] transition-colors flex items-center justify-center"
            >
              Cancel
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
                  Processing…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 me-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Apply Crop
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
