import { useState, useRef, useEffect } from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

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

  canvas.width = pixelCrop.width
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
 * Computes a centered crop. If aspect is given, uses it; otherwise defaults to 80% of image.
 */
function centerCrop(mediaWidth, mediaHeight, aspect) {
  let cropWidth, cropHeight

  if (aspect) {
    const mediaAspect = mediaWidth / mediaHeight
    if (mediaAspect > aspect) {
      cropHeight = mediaHeight * 0.85
      cropWidth = cropHeight * aspect
    } else {
      cropWidth = mediaWidth * 0.85
      cropHeight = cropWidth / aspect
    }
  } else {
    cropWidth = mediaWidth * 0.8
    cropHeight = mediaHeight * 0.8
  }

  return {
    unit: 'px',
    x: (mediaWidth - cropWidth) / 2,
    y: (mediaHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  }
}

/**
 * ImageCropModal
 *
 * Props:
 *   imageSrc      — blob URL or path of the image to crop
 *   aspect        — width/height ratio (default 3/4). Pass null for free crop.
 *   onConfirm     — (croppedFile: File) => void
 *   onCancel      — () => void
 */
export default function ImageCropModal({ imageSrc, aspect: initialAspect = 3 / 4, onConfirm, onCancel }) {
  const [crop, setCrop] = useState(null)
  const [lockAspect, setLockAspect] = useState(true)
  const [processing, setProcessing] = useState(false)
  const imgRef = useRef(null)

  const activeAspect = lockAspect ? initialAspect : undefined

  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget
    const { width, height } = e.currentTarget
    setCrop(centerCrop(width, height, lockAspect ? initialAspect : null))
  }

  // Recalculate crop when aspect lock toggles
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FDF0F2] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Crop Image</h3>
          </div>
          <button onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="flex items-center justify-center p-4 sm:p-6 crop-container"
             style={{ background: '#1a1a1a', minHeight: '320px', maxHeight: '62vh' }}>
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            aspect={activeAspect}
            minWidth={40}
            minHeight={40}
            keepSelection
            ruleOfThirds
            className="max-h-[56vh] [&_.ReactCrop__crop-selection]:!border-2 [&_.ReactCrop__crop-selection]:!border-white/80 [&_.ReactCrop__crop-selection]:!rounded-lg"
          >
            <img
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[56vh] w-auto mx-auto select-none"
              style={{ display: 'block' }}
              draggable={false}
            />
          </ReactCrop>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          {/* Aspect toggle */}
          <button type="button" onClick={toggleAspectLock}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              lockAspect
                ? 'bg-[#6B1F2A] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {lockAspect ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              )}
            </svg>
            {lockAspect ? '3:4 Locked' : 'Free Resize'}
          </button>

          {/* Size indicator */}
          {crop?.width > 0 && imgRef.current && (
            <span className="text-[11px] text-gray-400 tabular-nums">
              {Math.round(crop.width * (imgRef.current.naturalWidth / imgRef.current.width))}
              {' × '}
              {Math.round(crop.height * (imgRef.current.naturalHeight / imgRef.current.height))}
              px
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={processing || !crop?.width}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 hover:opacity-90"
            style={{ background: '#6B1F2A' }}>
            {processing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Processing…
              </span>
            ) : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  )
}
