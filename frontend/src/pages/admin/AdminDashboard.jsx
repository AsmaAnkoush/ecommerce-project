import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/adminApi'
import Spinner from '../../components/ui/Spinner'

function StatCard({ label, value, icon, colorClass, to, sub }) {
  return (
    <Link to={to} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-gray-900 leading-tight">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub != null && (
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        )}
      </div>
    </Link>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(res => setStats(res.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-40"><Spinner size="lg" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-sm text-gray-400 mt-1">نظرة عامة على المتجر</p>
      </div>

      {/* ── Low stock alert banner ──────────────────────────────────────── */}
      {stats.lowStockCount > 0 && (
        <Link to="/admin/products" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-6 hover:bg-amber-100 transition-colors">
          <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm font-medium text-amber-800">
            ⚠️ تنبيه: <span className="font-bold">{stats.lowStockCount}</span> منتج مخزونه منخفض (أقل من 5 قطع) — اضغط للمراجعة
          </p>
        </Link>
      )}

      {/* ── Top stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="طلبات اليوم"
          value={stats.ordersToday}
          colorClass="bg-[#6B1F2A]"
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          to="/admin/orders"
          sub="الطلبات المستلمة اليوم"
        />
        <StatCard
          label="طلبات معلّقة"
          value={stats.pendingOrders}
          colorClass="bg-amber-500"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          to="/admin/orders"
          sub="تحتاج إلى معالجة"
        />
        <StatCard
          label="إجمالي الإيرادات"
          value={`₪${Number(stats.totalRevenue).toFixed(0)}`}
          colorClass="bg-emerald-600"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          to="/admin/orders"
          sub={`من ${stats.totalOrders} طلب`}
        />
        <StatCard
          label="إجمالي المنتجات"
          value={stats.totalProducts}
          colorClass="bg-[#8B2535]"
          icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          to="/admin/products"
          sub={`${stats.totalUsers} عميل مسجّل`}
        />
      </div>

      {/* ── Secondary row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Best sellers */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">الأكثر مبيعاً</h2>
            <Link to="/admin/products" className="text-xs text-[#6B1F2A] hover:underline">عرض الكل</Link>
          </div>

          {stats.bestSellers && stats.bestSellers.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {stats.bestSellers.map((item, idx) => (
                <div key={item.productId} className="flex items-center gap-4 px-6 py-3">
                  {/* Rank */}
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-400'
                  }`}>{idx + 1}</span>

                  {/* Image */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#FDF0F2] shrink-0">
                    {item.productImage
                      ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-[#DFA3AD] text-xs">?</div>
                    }
                  </div>

                  {/* Name */}
                  <p className="flex-1 text-sm font-medium text-gray-900 truncate">{item.productName}</p>

                  {/* Units sold */}
                  <span className="text-sm font-bold text-[#6B1F2A] shrink-0">{item.totalSold} قطعة</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">لا توجد مبيعات بعد</div>
          )}
        </div>

        {/* Quick actions + overview */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">إجراءات سريعة</h2>
            <div className="space-y-2">
              <Link to="/admin/products/new" className="flex items-center gap-3 p-2.5 border border-dashed border-[#DFA3AD] rounded-xl hover:border-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors text-sm font-medium text-[#6B3840]">
                <span className="text-lg">+</span> إضافة منتج جديد
              </Link>
              <Link to="/admin/categories" className="flex items-center gap-3 p-2.5 border border-dashed border-[#DFA3AD] rounded-xl hover:border-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors text-sm font-medium text-[#6B3840]">
                <span className="text-lg">🏷️</span> إدارة الفئات
              </Link>
              <Link to="/admin/orders" className="flex items-center gap-3 p-2.5 border border-dashed border-[#DFA3AD] rounded-xl hover:border-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors text-sm font-medium text-[#6B3840]">
                <span className="text-lg">📦</span> جميع الطلبات
              </Link>
              <Link to="/admin/offers" className="flex items-center gap-3 p-2.5 border border-dashed border-[#DFA3AD] rounded-xl hover:border-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors text-sm font-medium text-[#6B3840]">
                <span className="text-lg">🏷</span> إضافة عرض
              </Link>
            </div>
          </div>

          {/* Overview */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">نظرة عامة</h2>
            <div className="space-y-2.5">
              {[
                { label: 'إجمالي الطلبات',   value: stats.totalOrders },
                { label: 'طلبات اليوم',       value: stats.ordersToday },
                { label: 'طلبات معلّقة',      value: stats.pendingOrders },
                { label: 'إجمالي العملاء',    value: stats.totalUsers },
                { label: 'منتجات نشطة',       value: stats.totalProducts },
                { label: '⚠️ مخزون منخفض',    value: stats.lowStockCount },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-900 text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
