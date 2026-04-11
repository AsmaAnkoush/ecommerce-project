import { useEffect, useState, useCallback } from 'react'
import { getAdminUsers, deleteAdminUser } from '../../api/adminApi'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

function RoleBadge({ role }) {
  const { t } = useLanguage()
  return role === 'ADMIN'
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#6B1F2A] text-white">{t('profile.admin')}</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{t('admin.customer')}</span>
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminUsers() {
  const { t } = useLanguage()
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const PAGE_SIZE = 15

  const load = useCallback(() => {
    setLoading(true)
    getAdminUsers({ page, size: PAGE_SIZE, search: search || undefined })
      .then(res => {
        const p = res.data.data
        setUsers(p.content)
        setTotal(p.totalElements)
        setTotalPages(p.totalPages)
      })
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(0)
  }

  const handleDelete = async (id) => {
    setActionLoading(`delete-${id}`)
    try {
      await deleteAdminUser(id)
      setConfirmDelete(null)
      load()
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.users')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} {t('admin.totalUsers')} {total === 1 ? t('admin.user') : t('admin.userPlural')}</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t('admin.searchNameEmail')}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFA3AD] w-64"
            />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium rounded-xl text-white transition-colors" style={{ background: '#6B1F2A' }}>
            {t('admin.search')}
          </button>
          {search && (
            <button type="button" onClick={handleClearSearch} className="px-3 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
              {t('admin.clear')}
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>{t('admin.noUsersFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100" style={{ background: '#FDF6F7' }}>
                  <th className="px-5 py-3.5 font-semibold text-gray-600 w-8">#</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600">{t('admin.name')}</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600">{t('admin.email')}</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600">{t('admin.phone')}</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600">{t('admin.role')}</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600 text-center">{t('admin.orders')}</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600">{t('admin.joined')}</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600 text-right">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user, idx) => {
                  const isSelf = me?.id === user.id
                  return (
                    <tr key={user.id} className="hover:bg-[#FDF6F7] transition-colors">
                      <td className="px-5 py-3.5 text-gray-400">{page * PAGE_SIZE + idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: 'linear-gradient(135deg, #6B1F2A, #DFA3AD)' }}>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                            {isSelf && <p className="text-[10px] text-[#9B3F4D]">{t('admin.you')}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{user.email}</td>
                      <td className="px-5 py-3.5 text-gray-600">{user.phone || <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {user.orderCount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {/* Delete */}
                          <button
                            disabled={isSelf || actionLoading === `delete-${user.id}`}
                            onClick={() => setConfirmDelete(user)}
                            title={isSelf ? t('admin.cannotDeleteOwn') : t('admin.deleteUser')}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-gray-500">
            {t('admin.showing')} {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} {t('admin.of')} {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('admin.previous')}
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700">
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('admin.next')}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{t('admin.deleteUser')}</h3>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-700">{confirmDelete.firstName} {confirmDelete.lastName}</span> ({confirmDelete.email}) {t('admin.deleteUserDesc')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors">
                {t('admin.cancel')}
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={actionLoading === `delete-${confirmDelete.id}`}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60 transition-colors">
                {actionLoading === `delete-${confirmDelete.id}` ? t('admin.deleting') : t('admin.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
