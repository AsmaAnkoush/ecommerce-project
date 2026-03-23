import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { placeOrder, placeGuestOrder } from '../api/orderApi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, fetchCart, clearCart } = useCart()
  const { isLoggedIn } = useAuth()

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    shippingAddress: '',
    city: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [guestSuccess, setGuestSuccess] = useState(null)
  const [phoneTouched, setPhoneTouched] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const phoneDigits = form.customerPhone.replace(/\D/g, '')
  const phoneState = !form.customerPhone.trim()
    ? 'empty'
    : phoneDigits.length < 9
    ? 'short'
    : phoneDigits.length > 15
    ? 'long'
    : 'valid'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customerName.trim()) { setError('Full name is required'); return }
    setPhoneTouched(true)
    if (phoneState !== 'valid') { setError('Enter a valid phone / WhatsApp number (9–15 digits)'); return }
    if (!form.shippingAddress.trim()) { setError('Address is required'); return }
    try {
      setLoading(true)
      setError('')

      if (!isLoggedIn) {
        const items = cart.items.map(item => ({ productId: item.productId, quantity: item.quantity }))
        const { data } = await placeGuestOrder({ ...form, items })
        clearCart()
        setGuestSuccess(data.data)
      } else {
        const { data } = await placeOrder(form)
        await fetchCart()
        navigate(`/orders/${data.data.id}`, { state: { fromCheckout: true } })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Guest order success screen
  if (guestSuccess) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">تم الطلب ✓</h2>
        <p className="text-gray-500 mb-1">
          شكراً لكِ، <span className="font-semibold text-gray-800">{guestSuccess.customerName}</span>
        </p>
        <p className="text-gray-500 mb-6">طلب رقم <span className="font-semibold text-gray-800">#{guestSuccess.id}</span></p>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-sm text-green-800 text-left flex gap-3">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-600 shrink-0 mt-0.5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <p>تم استلام طلبك بنجاح. سنتواصل معكِ عبر WhatsApp لتأكيد الطلب وترتيب الدفع والتوصيل.</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 text-left mb-8 space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-500">إجمالي الطلب</span>
            <span className="font-bold">₪{Number(guestSuccess.totalAmount).toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">الشحن إلى</span>
            <span className="font-medium text-start max-w-[60%]">
              {guestSuccess.shippingAddress}{guestSuccess.city ? `، ${guestSuccess.city}` : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">WhatsApp</span>
            <span className="font-medium">{guestSuccess.customerPhone}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={() => navigate('/products')}>متابعة التسوّق</Button>
          <Link to="/register" className="text-sm text-gray-500 hover:text-black">
            أنشئي حساباً لمتابعة طلباتك
          </Link>
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cart فارغ</h2>
        <Button onClick={() => navigate('/products')}>تسوّقي الآن</Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>

      {!isLoggedIn && (
        <p className="text-sm text-gray-500 mb-8">
          لديكِ حساب؟{' '}
          <Link to="/login" className="text-black font-medium hover:underline">Login</Link>
          {' '}لمتابعة طلباتك
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">بيانات الشحن</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="الاسم الكامل *" name="customerName" placeholder="مثال: سارة أحمد" value={form.customerName} onChange={handleChange} required />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">رقم الجوال / WhatsApp *</label>
                <div className="relative">
                  <input
                    type="tel"
                    name="customerPhone"
                    placeholder="مثال: 970 59 123 4567+"
                    value={form.customerPhone}
                    onChange={handleChange}
                    onBlur={() => setPhoneTouched(true)}
                    className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none transition-colors ${
                      phoneTouched && phoneState !== 'empty' && phoneState !== 'valid'
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : phoneTouched && phoneState === 'valid'
                        ? 'border-green-400 focus:border-green-500 bg-green-50'
                        : 'border-gray-300 focus:border-black'
                    }`}
                  />
                  {phoneTouched && phoneState === 'valid' && (
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {phoneTouched && (phoneState === 'short' || phoneState === 'long') && (
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  )}
                </div>
                <p className={`text-xs mt-1 transition-colors ${
                  phoneTouched && phoneState === 'short' ? 'text-red-500' :
                  phoneTouched && phoneState === 'long'  ? 'text-red-500' :
                  phoneTouched && phoneState === 'valid' ? 'text-green-600' :
                  'text-gray-400'
                }`}>
                  {phoneTouched && phoneState === 'short' && `قصير جداً — ${phoneDigits.length} رقم (الحد الأدنى 9)`}
                  {phoneTouched && phoneState === 'long'  && `طويل جداً — ${phoneDigits.length} رقم (الحد الأقصى 15)`}
                  {phoneTouched && phoneState === 'valid' && 'رقم صحيح ✓'}
                  {(!phoneTouched || phoneState === 'empty') && 'أدخلي رمز الدولة، مثال: 970+ 59...'}
                </p>
              </div>
            </div>
            <Input
              label="العنوان *"
              name="shippingAddress"
              placeholder="الشارع، رقم المنزل أو الشقة"
              value={form.shippingAddress}
              onChange={handleChange}
              required
            />
            <Input
              label="المدينة"
              name="city"
              placeholder="مثال: رام الله"
              value={form.city}
              onChange={handleChange}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">ملاحظات (اختياري)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="أي تعليمات خاصة بطلبك..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black" />
            </div>
          </div>

          {/* WhatsApp notice */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
            <div className="flex gap-3 items-start text-sm text-green-800">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-600 shrink-0 mt-0.5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <p>بعد تأكيد طلبك، سنتواصل معكِ عبر WhatsApp لتأكيد الدفع والتوصيل خلال 1–2 يوم عمل.</p>
            </div>
            {/* Shipping prices quick ref */}
            <div className="flex flex-wrap gap-2 text-xs text-green-700 ps-8">
              <span className="bg-white rounded-lg border border-green-200 px-2.5 py-1">📦 الضفة <strong>₪20</strong></span>
              <span className="bg-white rounded-lg border border-green-200 px-2.5 py-1">🏛️ القدس <strong>₪30</strong></span>
              <span className="bg-white rounded-lg border border-green-200 px-2.5 py-1">🚚 48 داخل <strong>₪70</strong></span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {isLoggedIn ? 'تأكيد الطلب' : 'تأكيد الطلب كضيف'} — ₪{Number(cart.totalPrice).toFixed(0)}
          </Button>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-5">ملخص الطلب</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-gray-400">الكمية: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">₪{Number(item.subtotal).toFixed(0)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-bold text-gray-900">
              <span>الإجمالي</span>
              <span>₪{Number(cart.totalPrice).toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
