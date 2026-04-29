import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as notificationApi from '../../api/notificationApi'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const ORDER_ICON = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

export default function NotificationBell() {
  const [open, setOpen]                   = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]             = useState(false)
  const dropdownRef                        = useRef(null)
  const navigate                           = useNavigate()

  /* ── Fetch just the badge count (lightweight, polled every 30s) ── */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount()
      setUnreadCount(res.data.data ?? 0)
    } catch { /* silent — don't break the UI */ }
  }, [])

  /* ── Fetch full list (only when panel opens) ── */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await notificationApi.getNotifications()
      setNotifications(res.data.data ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  /* Poll unread count on mount + every 30s */
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30_000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  /* Refresh on window focus */
  useEffect(() => {
    window.addEventListener('focus', fetchUnreadCount)
    return () => window.removeEventListener('focus', fetchUnreadCount)
  }, [fetchUnreadCount])

  /* Fetch list whenever panel opens */
  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  /* ── Actions ── */
  const handleMarkAllRead = async (e) => {
    e.stopPropagation()
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch { /* silent */ }
  }

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationApi.markAsRead(notif.id)
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        )
        setUnreadCount(c => Math.max(0, c - 1))
      } catch { /* silent */ }
    }
    if (notif.type === 'NEW_ORDER' && notif.relatedId) {
      navigate(`/admin/orders/${notif.relatedId}`)
    }
    setOpen(false)
  }

  const badge = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null

  return (
    <div ref={dropdownRef} className="relative">

      {/* ── Bell button ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        className={[
          'relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
          open ? 'bg-[#FDF0F2] text-[#6B1F2A]' : 'text-[#9B7B80] hover:bg-[#FDF0F2] hover:text-[#6B1F2A]',
        ].join(' ')}
      >
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {badge && (
          <span className="absolute -top-1 -end-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1 leading-none pointer-events-none">
            {badge}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          className="absolute end-0 top-[calc(100%+8px)] w-80 bg-white rounded-2xl z-50 overflow-hidden"
          style={{
            boxShadow: '0 8px 32px rgba(107,31,42,0.13), 0 1px 0 rgba(107,31,42,0.06)',
            border: '1px solid #F0DDE0',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid #F5EDEF' }}>
            <h3
              className="text-[#3D1A1E] font-semibold"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '17px' }}
            >
              Notifications
            </h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-[#6B1F2A] hover:underline transition-all"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[#C4A0A6] hover:bg-[#FDF0F2] hover:text-[#6B1F2A] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[360px] overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="py-10 flex justify-center">
                <svg className="animate-spin w-5 h-5 text-[#DFA3AD]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-3">
                <svg className="w-10 h-10 text-[#EDD8DC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-xs text-[#C4A0A6] font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif, i) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleItemClick(notif)}
                  className={[
                    'w-full flex items-start gap-3 px-4 py-3 text-start transition-colors',
                    !notif.isRead ? 'bg-[#FDF8F9] hover:bg-[#FDF0F2]' : 'hover:bg-[#FDF6F7]',
                  ].join(' ')}
                  style={i < notifications.slice(0, 20).length - 1 ? { borderBottom: '1px solid #F5EDEF' } : {}}
                >
                  {/* Type icon */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: !notif.isRead ? '#FDF0F2' : '#F5EDEF',
                      color: !notif.isRead ? '#6B1F2A' : '#C4A0A6',
                    }}
                  >
                    {ORDER_ICON}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] leading-snug"
                      style={{ color: !notif.isRead ? '#3D1A1E' : '#9B7B80', fontWeight: !notif.isRead ? 600 : 400 }}
                    >
                      {notif.message}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#C4A0A6' }}>
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#6B1F2A] shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
