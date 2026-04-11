import { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getOrder } from '../api/orderApi'
import { useLanguage } from '../context/LanguageContext'
import { useFormatPrice } from '../utils/formatPrice'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

const STATUS_VARIANT = {
  PENDING:   'warning',
  CONFIRMED: 'info',
  CANCELLED: 'danger',
}

const STATUS_STEPS = ['PENDING', 'CONFIRMED']

export default function OrderDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()
  const fromCheckout = location.state?.fromCheckout

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrder(id)
      .then((res) => setOrder(res.data.data ?? null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-40"><Spinner size="lg" /></div>
  if (!order) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-sm text-[#9B7B80] mb-4">{t('admin.orderNotFound')}</p>
      <Link to="/products" className="text-sm font-medium text-[#6B1F2A] hover:text-[#8B2535] transition-colors">
        {t('home.shopNow')}
      </Link>
    </div>
  )

  const currentStep = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Success message */}
      {fromCheckout && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-green-800">{t('orders.orderPlaced')}</p>
            <p className="text-sm text-green-700 mt-0.5">
              {t('orders.orderPlacedDesc')}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('orders.orderNumber')} #{order.id}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('orders.placedOn')} {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status] || 'default'}>{order.status}</Badge>
      </div>

      {/* Progress */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">{t('orders.orderProgress')}</h2>
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="flex items-center min-w-[340px]">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= currentStep ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {i < currentStep ? (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <p className="text-[9px] sm:text-xs text-gray-500 mt-1 w-16 sm:w-20 text-center leading-tight">
                      {t('status.' + step)}
                    </p>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-0.5 sm:mx-1 transition-colors ${i < currentStep ? 'bg-black' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">{t('orders.itemsOrdered')}</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('cart.qty')}: {item.quantity} × {formatPrice(item.unitPrice)}</p>
              </div>
              <p className="font-bold text-gray-900 text-sm">{formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 mt-5 pt-4 flex justify-between font-bold text-gray-900">
          <span>{t('orders.total')}</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* Shipping & Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('orders.shippingAddress')}</h3>
          <p className="text-sm text-gray-800">{order.shippingAddress}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('orders.contact')}</h3>
          {order.customerPhone ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-800">{order.customerPhone}</p>
              <a
                href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shrink-0"
                title={t('orders.openWhatsApp')}
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
          {order.trackingNumber && (
            <p className="text-xs text-gray-500 mt-2">{t('orders.tracking')}: {order.trackingNumber}</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Link to="/orders" className="text-sm font-medium text-gray-600 hover:text-black transition-colors flex items-center gap-1">
          {t('orders.backToOrders')}
        </Link>
        <Link to="/products" className="text-sm font-medium text-gray-600 hover:text-black transition-colors ml-auto">
          {t('orders.continueShopping')}
        </Link>
      </div>
    </div>
  )
}
