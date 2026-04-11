import { useEffect, useCallback } from 'react'

/**
 * ImagePreviewModal (Lightbox)
 *
 * Props:
 *   images    — array of image URLs
 *   index     — currently active index
 *   onClose   — () => void
 *   onChange   — (newIndex: number) => void  (for next/prev navigation)
 */
export default function ImagePreviewModal({ images = [], index = 0, onClose, onChange }) {
  const count = images.length
  const src = images[index]

  const goPrev = useCallback(() => {
    if (count > 1) onChange((index - 1 + count) % count)
  }, [index, count, onChange])

  const goNext = useCallback(() => {
    if (count > 1) onChange((index + 1) % count)
  }, [index, count, onChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, goPrev, goNext])

  if (!src) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
         onClick={onClose}>

      {/* Close button */}
      <button onClick={onClose}
        className="absolute top-4 end-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      {count > 1 && (
        <div className="absolute top-5 start-1/2 -translate-x-1/2 z-10 text-white/60 text-xs tabular-nums">
          {index + 1} / {count}
        </div>
      )}

      {/* Previous button */}
      {count > 1 && (
        <button
          onClick={e => { e.stopPropagation(); goPrev() }}
          className="absolute start-3 sm:start-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
          <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {count > 1 && (
        <button
          onClick={e => { e.stopPropagation(); goNext() }}
          className="absolute end-3 sm:end-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
          <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <img
        src={src}
        alt="Preview"
        onClick={e => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none"
        draggable={false}
      />
    </div>
  )
}
