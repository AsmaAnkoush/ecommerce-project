import { useEffect, useRef } from 'react'

const MIN_SWIPE_PX = 40 // minimum horizontal distance to count as a swipe

/**
 * Attaches touch-swipe navigation to a DOM element.
 * Uses addEventListener directly (not React's synthetic events) so
 * touchmove can be registered as { passive: false }, which is the only
 * way to call e.preventDefault() and suppress page scroll during a
 * horizontal swipe.
 *
 * Returns a cleanup function suitable for useEffect's return value.
 */
function attachTouchNav(el, onNextRef, onPrevRef) {
  let startX = null
  let startY = null

  const onStart = (e) => {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
  }

  const onMove = (e) => {
    if (startX === null) return
    const dx = Math.abs(e.touches[0].clientX - startX)
    const dy = Math.abs(e.touches[0].clientY - startY)
    // Suppress vertical scroll only when horizontal intent is clear
    if (dx > dy && dx > 8) e.preventDefault()
  }

  const onEnd = (e) => {
    if (startX === null) return
    const dx = e.changedTouches[0].clientX - startX
    const dy = e.changedTouches[0].clientY - startY
    if (Math.abs(dx) >= MIN_SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? onNextRef.current() : onPrevRef.current()
    }
    startX = null
    startY = null
  }

  el.addEventListener('touchstart', onStart, { passive: true })
  el.addEventListener('touchmove',  onMove,  { passive: false }) // non-passive: needed for preventDefault
  el.addEventListener('touchend',   onEnd,   { passive: true })

  return () => {
    el.removeEventListener('touchstart', onStart)
    el.removeEventListener('touchmove',  onMove)
    el.removeEventListener('touchend',   onEnd)
  }
}

/**
 * useGalleryNav — keyboard (global) + touch (on a ref'd container).
 *
 * Keyboard:
 *   ArrowRight → next   ArrowLeft → prev
 *   Skipped when focus is inside an input/textarea/select.
 *
 * Touch:
 *   Swipe left  → next   Swipe right → prev
 *   Horizontal swipes suppress page scroll.
 *
 * Usage:
 *   const galleryRef = useGalleryNav({ count, onNext, onPrev })
 *   <div ref={galleryRef}>…</div>
 */
export function useGalleryNav({ count, onNext, onPrev }) {
  const ref = useRef(null)

  // Stable refs for callbacks — avoids stale closures without making
  // them effect dependencies (which would cause listener churn).
  const onNextRef = useRef(onNext)
  const onPrevRef = useRef(onPrev)
  useEffect(() => { onNextRef.current = onNext }, [onNext])
  useEffect(() => { onPrevRef.current = onPrev }, [onPrev])

  // ── Keyboard (global window listener) ────────────────────────────────────
  useEffect(() => {
    if (count <= 1) return
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select, [contenteditable]')) return
      if (e.key === 'ArrowRight')      { e.preventDefault(); onNextRef.current() }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); onPrevRef.current() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count])

  // ── Touch (scoped to the ref'd container) ────────────────────────────────
  useEffect(() => {
    const el = ref.current
    if (!el || count <= 1) return
    return attachTouchNav(el, onNextRef, onPrevRef)
  }, [count])

  return ref
}

/**
 * useTouchNav — touch-only navigation for conditionally rendered elements
 * (e.g. a modal that is not always in the DOM).
 *
 * Use a callback ref / useState to capture the element:
 *   const [modalEl, setModalEl] = useState(null)
 *   useTouchNav({ element: modalEl, count, onNext, onPrev })
 *   {open && <div ref={setModalEl}>…</div>}
 *
 * When the element mounts/unmounts, `element` changes → the effect
 * re-runs and attaches/detaches listeners automatically.
 */
export function useTouchNav({ element, count, onNext, onPrev }) {
  const onNextRef = useRef(onNext)
  const onPrevRef = useRef(onPrev)
  useEffect(() => { onNextRef.current = onNext }, [onNext])
  useEffect(() => { onPrevRef.current = onPrev }, [onPrev])

  useEffect(() => {
    if (!element || count <= 1) return
    return attachTouchNav(element, onNextRef, onPrevRef)
  }, [element, count])
}
