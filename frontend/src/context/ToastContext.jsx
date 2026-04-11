import { createContext, useContext, useState, useCallback, useRef } from 'react'

/**
 * Lightweight toast notification system.
 *
 * Usage anywhere in the app:
 *   const { toast } = useToast()
 *   toast('تمت الإضافة إلى السلة')
 *   toast('حدث خطأ', 'error')
 *
 * Toasts stack vertically, auto-dismiss after 3 s, and can be manually
 * dismissed. Max 5 visible at once (oldest is evicted when the 6th arrives).
 */

const ToastContext = createContext(null)

const TOAST_DURATION = 3000
const MAX_TOASTS = 5

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const toast = useCallback((message, type = 'success') => {
    const id = ++idRef.current
    setToasts(prev => {
      const next = [...prev, { id, message, type }]
      return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next
    })
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, TOAST_DURATION)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container — fixed bottom-center, above bottom nav */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-20 md:bottom-8 inset-x-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none"
        >
          {toasts.map(t => (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              className={[
                'pointer-events-auto',
                'inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl',
                'text-sm font-medium tracking-wide shadow-lg',
                'animate-fade-in-up cursor-pointer select-none',
                'transition-all duration-200 hover:scale-[1.02]',
                t.type === 'error'
                  ? 'bg-red-600 text-white shadow-red-600/25'
                  : 'bg-[#6B1F2A] text-white shadow-[#6B1F2A]/25',
              ].join(' ')}
            >
              {t.type === 'error' ? (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
