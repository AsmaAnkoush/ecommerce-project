import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { placeOrder, placeGuestOrder } from '../api/orderApi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useFormatPrice } from '../utils/formatPrice'
import { useLanguage } from '../context/LanguageContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const WHATSAPP_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, fetchCart, clearCart } = useCart()
  const { isLoggedIn } = useAuth()
  const { openLogin, openRegister } = useUI()
  const { t } = useLanguage()
  const formatPrice = useFormatPrice()

  const [form, setForm] = useState({
    customerName: '', customerPhone: '', shippingAddress: '', city: '', notes: '',
  })
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [guestSuccess, setGuestSuccess] = useState(null)
  const [phoneTouched, setPhoneTouched] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const phoneDigits = form.customerPhone.replace(/\D/g, '')
  const phoneState  = !form.customerPhone.trim() ? 'empty'
    : phoneDigits.length < 9  ? 'short'
    : phoneDigits.length > 15 ? 'long'
    : 'valid'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customerName.trim()) { setError(t('checkout.nameRequired')); return }
    setPhoneTouched(true)
    if (phoneState !== 'valid') { setError(t('checkout.phoneInvalid')); return }
    if (!form.shippingAddress.trim()) { setError(t('checkout.addressRequired')); return }
    try {
      setLoading(true); setError('')
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
      setError(err.response?.data?.message || t('checkout.failedOrder'))
    } finally { setLoading(false) }
  }

  /* ── Guest success screen ────────────────────────────────── */
  if (guestSuccess) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-18 h-18 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-200"
          style={{ width: 72, height: 72 }}>
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl font-light text-[#3D1A1E] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t('checkout.orderReceived')}
        </h2>
        <p className="text-sm text-[#9B7B80] mb-1">
          {t('checkout.thankYou')}، <span className="font-semibold text-[#3D1A1E]">{guestSuccess.customerName}</span>
        </p>
        <div className="mb-7" />

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5 text-xs text-emerald-800 text-start flex gap-3">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-600 shrink-0 mt-0.5 flex-shrink-0"><path d={WHATSAPP_PATH}/></svg>
          <p className="leading-relaxed">{t('checkout.whatsappNotice')}</p>
        </div>

        <div className="bg-white border border-[#F0D5D8] rounded-2xl p-5 text-start mb-8 space-y-3 text-sm"
          style={{ boxShadow: '0 2px 16px rgba(107,31,42,0.06)' }}>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#9B7B80] tracking-wide">{t('checkout.orderTotal')}</span>
            <span className="font-light text-[#6B1F2A]" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}>
              {formatPrice(guestSuccess.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs text-[#9B7B80] tracking-wide shrink-0">{t('checkout.shippingTo')}</span>
            <span className="text-xs font-medium text-[#3D1A1E] text-end max-w-[60%]">
              {guestSuccess.shippingAddress}{guestSuccess.city ? `، ${guestSuccess.city}` : ''}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#9B7B80] tracking-wide">WhatsApp</span>
            <span className="text-xs font-medium text-[#3D1A1E]">{guestSuccess.customerPhone}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={() => navigate('/products')}>{t('cart.continueShopping')}</Button>
          <button type="button" onClick={openRegister} className="text-xs text-[#9B7B80] hover:text-[#6B1F2A] transition-colors tracking-wide">
            {t('checkout.createAccountPrompt')}
          </button>
        </div>
      </div>
    )
  }

  /* ── Empty cart ──────────────────────────────────────────── */
  if (cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-light text-[#3D1A1E] mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t('checkout.cartEmpty')}
        </h2>
        <Button onClick={() => navigate('/products')}>{t('home.shopNow')}</Button>
      </div>
    )
  }

  /* ── Main checkout ───────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-light text-[#3D1A1E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t('checkout.title')}
        </h1>
        {!isLoggedIn && (
          <p className="text-xs text-[#9B7B80] mt-2 tracking-wide">
            {t('checkout.haveAccount')}{' '}
            <button type="button" onClick={openLogin} className="text-[#6B1F2A] font-semibold hover:text-[#8B2535] transition-colors underline underline-offset-2 decoration-[#DFA3AD]">
              {t('checkout.signInLink')}
            </button>
            {' '}{t('checkout.trackLater')}
          </p>
        )}
        <div className="h-0.5 w-12 mt-2" style={{ background: 'linear-gradient(90deg, #DFA3AD, transparent)' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">

        {/* ── Shipping form ─────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          <div
            className="bg-white rounded-2xl p-6 space-y-4"
            style={{ boxShadow: '0 2px 20px rgba(107,31,42,0.07)', border: '1px solid #F5E0E3' }}
          >
            <h2 className="text-xl font-light text-[#3D1A1E]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('checkout.shippingInfo')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('checkout.fullName')}
                name="customerName"
                placeholder={t('checkout.fullNamePlaceholder')}
                value={form.customerName}
                onChange={handleChange}
                required
              />

              {/* Phone field with validation indicator */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-[0.08em] uppercase text-[#6B3840]">
                  {t('checkout.phoneLabel')}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="customerPhone"
                    placeholder="+970 59 123 4567"
                    value={form.customerPhone}
                    onChange={handleChange}
                    onBlur={() => setPhoneTouched(true)}
                    className={[
                      'w-full px-4 py-3 rounded-xl text-sm text-[#3D1A1E] bg-white border transition-all duration-200 outline-none placeholder:text-[#C4A0A6] input-focus-glow',
                      phoneTouched && phoneState !== 'empty' && phoneState !== 'valid'
                        ? 'border-red-300 focus:border-red-400 bg-red-50/30'
                        : phoneTouched && phoneState === 'valid'
                        ? 'border-emerald-300 focus:border-emerald-400 bg-emerald-50/20'
                        : 'border-[#EDD8DC] focus:border-[#DFA3AD]',
                    ].join(' ')}
                  />
                  {phoneTouched && phoneState === 'valid' && (
                    <svg className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                  {phoneTouched && (phoneState === 'short' || phoneState === 'long') && (
                    <svg className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  )}
                </div>
                <p className={`text-[10px] transition-colors tracking-wide ${
                  phoneTouched && phoneState === 'short' ? 'text-red-500' :
                  phoneTouched && phoneState === 'long'  ? 'text-red-500' :
                  phoneTouched && phoneState === 'valid' ? 'text-emerald-600' :
                  'text-[#C4A0A6]'
                }`}>
                  {phoneTouched && phoneState === 'short' && t('checkout.phoneShort').replace('{count}', phoneDigits.length)}
                  {phoneTouched && phoneState === 'long'  && t('checkout.phoneLong').replace('{count}', phoneDigits.length)}
                  {phoneTouched && phoneState === 'valid' && t('checkout.phoneValid')}
                  {(!phoneTouched || phoneState === 'empty') && t('checkout.phoneHint')}
                </p>
              </div>
            </div>

            <Input
              label={t('checkout.addressLabel')}
              name="shippingAddress"
              placeholder={t('checkout.addressPlaceholder')}
              value={form.shippingAddress}
              onChange={handleChange}
              required
            />
            <Input
              label={t('checkout.city')}
              name="city"
              placeholder={t('checkout.cityPlaceholder')}
              value={form.city}
              onChange={handleChange}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold tracking-[0.08em] uppercase text-[#6B3840]">
                {t('checkout.notes')}
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                placeholder={t('checkout.notesPlaceholder')}
                className="w-full px-4 py-3 border border-[#EDD8DC] rounded-xl text-sm text-[#3D1A1E] focus:outline-none focus:border-[#DFA3AD] resize-none bg-white placeholder:text-[#C4A0A6] transition-colors input-focus-glow"
              />
            </div>
          </div>

          {/* WhatsApp notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
            <div className="flex gap-3 items-start text-xs text-emerald-800">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-600 shrink-0 mt-0.5 flex-shrink-0">
                <path d={WHATSAPP_PATH}/>
              </svg>
              <p className="leading-relaxed">{t('checkout.whatsappConfirm')}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-emerald-700 ps-8">
              {[['📦', t('checkout.westBank'), 20], ['🏛️', t('checkout.jerusalem'), 30], ['🚚', t('checkout.inside48'), 70]].map(([icon, label, price]) => (
                <span key={label} className="bg-white rounded-xl border border-emerald-200 px-3 py-1 flex items-center gap-1">
                  {icon} {label} <strong>{formatPrice(price)}</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Return & exchange policy */}
          <div className="flex items-start gap-3 border border-[#EDD8DC] rounded-2xl px-4 py-3 bg-[#FDFAF8]">
            <svg className="w-4 h-4 text-[#B08A90] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-[#9B7B80] leading-relaxed space-y-0.5">
              <p><span className="font-semibold text-red-600">{t('checkout.noReturns')}</span></p>
              <p><span className="font-semibold text-amber-700">{t('checkout.exchangePolicy')}</span></p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {isLoggedIn ? t('checkout.confirmOrder') : t('checkout.confirmGuestOrder')} — {formatPrice(cart.totalPrice)}
          </Button>
        </form>

        {/* ── Order summary sidebar ─────────────────────────── */}
        <div className="lg:col-span-2">
          <div
            className="bg-white rounded-2xl p-5 lg:sticky lg:top-24"
            style={{ boxShadow: '0 2px 20px rgba(107,31,42,0.07)', border: '1px solid #F5E0E3' }}
          >
            <h2 className="font-light text-[#3D1A1E] mb-4 pb-4 border-b border-[#F0D5D8]"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}>
              {t('checkout.summary')}
            </h2>

            <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide mb-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#F9EEF0] rounded-xl overflow-hidden shrink-0 border border-[#F0D5D8]">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-light text-[#3D1A1E] line-clamp-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '13px' }}>
                      {item.productName}
                    </p>
                    <p className="text-[10px] text-[#9B7B80] tracking-wide">× {item.quantity}</p>
                  </div>
                  <p className="text-xs font-medium text-[#3D1A1E] shrink-0">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-[#F0D5D8] pt-4 space-y-2">
              <div className="flex justify-between text-xs text-[#9B7B80]">
                <span>{t('cart.subtotal')}</span>
                <span>{formatPrice(cart.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#9B7B80]">
                <span>{t('checkout.shipping')}</span>
                <span className="text-emerald-600 font-medium">{t('checkout.uponConfirmation')}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#F0D5D8]">
                <span className="text-xs font-medium text-[#3D1A1E] tracking-wide uppercase">{t('cart.total')}</span>
                <span className="font-light text-[#6B1F2A]" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}>
                  {formatPrice(cart.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
