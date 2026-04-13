import { useEffect, useState } from 'react'
import { getAdminReviews, approveReview, rejectReview } from '../../api/reviewApi'
import Spinner from '../../components/ui/Spinner'
import PageHeader from '../../components/layout/PageHeader'
import { useLanguage } from '../../context/LanguageContext'

const STARS = [1, 2, 3, 4, 5]

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {STARS.map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

function StatusBadge({ approved }) {
  const { t } = useLanguage()
  return approved
    ? <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        {t('admin.approved')}
      </span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
        {t('status.PENDING')}
      </span>
}

export default function AdminReviews() {
  const { t } = useLanguage()
  const [reviews, setReviews]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filter, setFilter]     = useState('all') // all | pending | approved
  const [acting, setActing]     = useState(null)  // id of row being actioned

  const fetchReviews = (p = page) => {
    setLoading(true)
    getAdminReviews({ page: p, size: 20 })
      .then(res => {
        const data = res.data.data
        setReviews(data.content)
        setTotalPages(data.totalPages)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchReviews(0); setPage(0) }, [])

  const handleApprove = async (id) => {
    setActing(id)
    try {
      const res = await approveReview(id)
      setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: res.data.data.approved } : r))
    } finally { setActing(null) }
  }

  const handleReject = async (id) => {
    setActing(id)
    try {
      const res = await rejectReview(id)
      setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: res.data.data.approved } : r))
    } finally { setActing(null) }
  }

  const handlePage = (p) => { setPage(p); fetchReviews(p) }

  const visible = reviews.filter(r =>
    filter === 'all' ? true : filter === 'approved' ? r.approved : !r.approved
  )

  const pendingCount  = reviews.filter(r => !r.approved).length
  const approvedCount = reviews.filter(r => r.approved).length

  return (
    <div>
      <PageHeader
        title={t('admin.reviews')}
        subtitle={t('admin.headerReviewsSub')}
        icon="⭐"
        color="#7B1E2B"
      />
      <div className="p-6 sm:p-8 max-w-5xl pt-0">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'all',      label: `${t('admin.allOrders')} (${reviews.length})` },
          { key: 'pending',  label: `${t('status.PENDING')} (${pendingCount})` },
          { key: 'approved', label: `${t('admin.approved')} (${approvedCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="font-medium">{t('admin.noReviewsFound')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(review => (
            <div
              key={review.id}
              className={`bg-white rounded-2xl border p-5 transition-colors ${
                review.approved ? 'border-gray-100' : 'border-amber-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                {/* Avatar + user */}
                <div className="flex items-center gap-3 sm:w-44 shrink-0">
                  <div className="w-9 h-9 rounded-full bg-[#6B1F2A] text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    {review.userName?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{review.userName}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Review body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} />
                    <StatusBadge approved={review.approved} />
                  </div>
                  <p className="text-xs text-[#6B1F2A] font-medium mb-1 truncate">
                    {review.productName}
                  </p>
                  {review.comment ? (
                    <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">{t('admin.noComment')}</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex sm:flex-col gap-2 shrink-0">
                  {!review.approved ? (
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {acting === review.id ? <Spinner size="sm" /> : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {t('admin.approve')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReject(review.id)}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      {acting === review.id ? <Spinner size="sm" /> : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                      {t('admin.hide')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('admin.prev')}
          </button>
          <span className="text-sm text-gray-500">{t('admin.page')} {page + 1} / {totalPages}</span>
          <button
            onClick={() => handlePage(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('admin.nextPage')}
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
