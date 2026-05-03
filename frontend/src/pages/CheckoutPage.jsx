import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { placeOrder, placeGuestOrder } from '../api/orderApi'
import { getShippingZones } from '../api/shippingApi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useToast } from '../context/ToastContext'
import { useFormatPrice } from '../utils/formatPrice'
import { useLanguage } from '../context/LanguageContext'
import CartIcon from '../components/ui/CartIcon'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import ShippingZoneSelector from '../components/checkout/ShippingZoneSelector'

const WHATSAPP_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

const CARD_BASE = 'bg-white border border-[#F0D5D8] rounded-2xl'
const CARD_SHADOW = { boxShadow: '0 2px 12px rgba(107,31,42,0.05)' }
const PRIMARY_BTN = 'btn-primary-pill'


function PageHero({ icon, title, subtitle, children }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FDF6F7] to-[#F5E1E5]" />
      <div className="absolute -top-20 -end-20 w-56 h-56 rounded-full bg-[#DFA3AD] opacity-15 blur-3xl" />
      <div className="absolute -bottom-16 -start-16 w-64 h-64 rounded-full bg-[#E8B4BC] opacity-10 blur-3xl" />
      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-10 text-center flex flex-col items-center gap-2">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-[0_3px_12px_rgba(107,31,42,0.1)]">
          {typeof icon === 'string' ? (
            <svg className="w-[18px] h-[18px] text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          ) : icon}
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-[#6B1F2B] tracking-[0.04em] sm:tracking-[0.06em] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
          {title}
        </h1>
        <span className="inline-block h-px w-12 bg-gradient-to-r from-transparent via-[#DFA3AD] to-transparent" />
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#9B7B80] max-w-md mx-auto leading-relaxed font-light">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, fetchCart, clearCart } = useCart()
  const { isLoggedIn } = useAuth()
  const { openLogin, openRegister } = useUI()
  const { t } = useLanguage()
  const { toast } = useToast()
  const formatPrice = useFormatPrice()

  const [form, setForm] = useState({
    customerName: '', customerPhone: '', shippingAddress: '', city: '', notes: '',
  })
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [guestSuccess, setGuestSuccess] = useState(null)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [zones, setZones]               = useState([])
  const [zonesLoading, setZonesLoading] = useState(true)
  const [zonesLoadError, setZonesLoadError] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const [zoneError, setZoneError]       = useState(false)

  const loadZones = () => {
    setZonesLoading(true)
    setZonesLoadError(false)
    getShippingZones()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setZones(data)
      })
      .catch(() => setZonesLoadError(true))
      .finally(() => setZonesLoading(false))
  }

  useEffect(() => { loadZones() }, [])

  const handleZoneChange = (zone) => {
    setSelectedZone(zone)
    setZoneError(false)
  }

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
    if (!selectedZone) { setZoneError(true); setError(t('checkout.shippingZoneRequired')); return }
    try {
      setLoading(true); setError('')
      if (!isLoggedIn) {
        const items = cart.items.map(item => ({
          productId: item.productId,
          quantity:  item.quantity,
          size:      item.size  || null,
          color:     item.color || null,
        }))
        const { data } = await placeGuestOrder({ ...form, items, shippingZoneId: selectedZone.id })
        clearCart()
        toast(t('orders.placedToast'))
        setGuestSuccess(data.data)
      } else {
        const { data } = await placeOrder({ ...form, shippingZoneId: selectedZone.id })
        await fetchCart()
        toast(t('orders.placedToast'))
        navigate(`/orders/${data.data.id}`, { state: { fromCheckout: true } })
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('orders.placeFailed')
      setError(msg)
      toast(msg, 'error')
    } finally { setLoading(false) }
  }

  /* ── Guest success screen ────────────────────────────────── */
  if (guestSuccess) {
    return (
      <div className="bg-[#FDF6F7] min-h-screen">
        <PageHero
          icon="M5 13l4 4L19 7"
          title={t('checkout.orderReceived')}
          subtitle={`${t('checkout.thankYou')}، ${guestSuccess.customerName}`}
        />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-5">
          <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] px-5 py-4 flex items-start gap-3`} style={CARD_SHADOW}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-600 shrink-0 mt-0.5"><path d={WHATSAPP_PATH} /></svg>
            <p className="text-xs text-[#6B4E53] leading-relaxed">{t('checkout.whatsappNotice')}</p>
          </div>

          <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] px-5 py-5 space-y-3 text-sm`} style={CARD_SHADOW}>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#9B7B80] tracking-wide">{t('checkout.orderTotal')}</span>
              <span className="font-light text-[#6B1F2A] text-xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {formatPrice(guestSuccess.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-start gap-3">
              <span className="text-xs text-[#9B7B80] tracking-wide shrink-0">{t('checkout.shippingTo')}</span>
              <span className="text-xs font-medium text-[#3D1A1E] text-end">
                {guestSuccess.shippingAddress}{guestSuccess.city ? `، ${guestSuccess.city}` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#9B7B80] tracking-wide">WhatsApp</span>
              <span className="text-xs font-medium text-[#3D1A1E]">{guestSuccess.customerPhone}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button onClick={() => navigate('/products')} className={`${PRIMARY_BTN} w-full sm:w-auto`}>
              {t('cart.continueShopping')}
              <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <button type="button" onClick={openRegister} className="text-xs text-[#9B7B80] hover:text-[#6B1F2A] transition-colors tracking-wide">
              {t('checkout.createAccountPrompt')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Empty cart ──────────────────────────────────────────── */
  if (cart.items.length === 0) {
    return (
      <div className="bg-[#FDF6F7] min-h-screen">
        <PageHero
          icon={<CartIcon className="w-[18px] h-[18px] text-[#6B1F2A]" strokeWidth={1.5} />}
          title={t('checkout.cartEmpty')}
          subtitle={t('orders.noOrdersSub')}
        />
        <div className="max-w-md mx-auto px-4 py-10 text-center">
          <button onClick={() => navigate('/products')} className={`${PRIMARY_BTN} w-full sm:w-auto`}>
            {t('home.shopNow')}
            <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  /* ── Main checkout ───────────────────────────────────────── */
  return (
    <div className="bg-[#FDF6F7] min-h-screen">
      <PageHero
        icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        title={t('checkout.title')}
        subtitle={!isLoggedIn ? undefined : undefined}
      >
        {!isLoggedIn && (
          <p className="text-[11px] text-[#9B7B80] tracking-wide mt-1">
            {t('checkout.haveAccount')}{' '}
            <button type="button" onClick={openLogin} className="text-[#6B1F2A] font-semibold hover:text-[#8B2535] transition-colors underline underline-offset-2 decoration-[#DFA3AD]">
              {t('checkout.signInLink')}
            </button>
            {' '}{t('checkout.trackLater')}
          </p>
        )}
      </PageHero>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">

          {/* ── Shipping form ─────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="md:col-span-3 space-y-5">
            {/* Shipping info card */}
            <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] p-6 space-y-4`} style={CARD_SHADOW}>
              <h2 className="text-base sm:text-lg font-medium text-[#6B1F2B] tracking-[0.04em]" style={{ fontFamily: 'Playfair Display, serif' }}>
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

              <div>
                <Input label={t('checkout.addressLabel')} name="shippingAddress" placeholder={t('checkout.addressPlaceholder')} value={form.shippingAddress} onChange={handleChange} required />
                <p className="mt-1 text-[10px] text-[#B08A90] tracking-wide leading-relaxed">
                  {t('checkout.addressHelper')}
                </p>
              </div>
              <Input label={t('checkout.city')} name="city" placeholder={t('checkout.cityPlaceholder')} value={form.city} onChange={handleChange} />

              {/* Shipping zone selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-[0.08em] uppercase text-[#6B3840]">
                  {t('checkout.selectShippingZone')}
                </label>
                {zonesLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="animate-pulse h-12 rounded-xl bg-[#F9EEF0]" />
                    ))}
                  </div>
                ) : zonesLoadError ? (
                  <div className="flex items-center justify-between px-4 py-3 border border-red-200 bg-red-50/40 rounded-xl text-xs text-red-600">
                    <span>{t('checkout.zonesLoadError')}</span>
                    <button type="button" onClick={loadZones} className="font-semibold underline underline-offset-2 hover:text-red-800 transition-colors">
                      {t('checkout.retry')}
                    </button>
                  </div>
                ) : zones.length === 0 ? (
                  <p className="px-4 py-3 border border-[#EDD8DC] rounded-xl text-xs text-[#9B7B80] text-center italic">
                    {t('checkout.noDeliveryAreas')}
                  </p>
                ) : (
                  <ShippingZoneSelector zones={zones} selectedId={selectedZone?.id ?? null} onChange={handleZoneChange} hasError={zoneError} />
                )}
              </div>

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

            {/* WhatsApp notice card */}
            <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] p-4 sm:p-5`} style={CARD_SHADOW}>
              <div className="flex gap-3 items-start">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-500 shrink-0 mt-0.5"><path d={WHATSAPP_PATH}/></svg>
                <p className="text-xs text-[#6B4E53] leading-relaxed">{t('checkout.whatsappConfirm')}</p>
              </div>
            </div>

            {/* Return & exchange policy card */}
            <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] px-4 py-3 flex items-start gap-3`} style={CARD_SHADOW}>
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

            {/* Total + submit */}
            <div className={`${CARD_BASE} p-5`} style={CARD_SHADOW}>
              {selectedZone && (
                <div className="flex flex-col gap-1.5 mb-3 pb-3 border-b border-[#F0D5D8]">
                  <div className="flex justify-between text-[11px] text-[#9B7B80]">
                    <span>{t('cart.subtotal')}</span>
                    <span className="nums-normal">{formatPrice(cart.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#9B7B80]">
                    <span className="flex items-center gap-1">
                      <span>{selectedZone.icon}</span>
                      <span>{t('checkout.shipping')}</span>
                    </span>
                    <span className="nums-normal">{formatPrice(selectedZone.price)}</span>
                  </div>
                </div>
              )}
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-xs text-[#9B7B80] tracking-wide uppercase">{t('cart.total')}</span>
                <span className="text-2xl font-light text-[#6B1F2A] nums-normal" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {formatPrice(Number(cart.totalPrice) + Number(selectedZone?.price || 0))}
                </span>
              </div>
              <Button type="submit" size="lg" className="w-full" loading={loading} disabled={zones.length === 0}>
                {t('checkout.confirmOrder')}
              </Button>
            </div>
          </form>

          {/* ── Order summary sidebar ─────────────────────────── */}
          <div className="md:col-span-2">
            <div className={`card-hover ${CARD_BASE} hover:border-[#DFA3AD] p-5 md:sticky md:top-24`} style={CARD_SHADOW}>
              <h2 className="text-base font-medium text-[#6B1F2B] tracking-[0.04em] mb-4 pb-4 border-b border-[#F0D5D8]" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t('checkout.summary')}
              </h2>

              <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide mb-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#F9EEF0] rounded-xl overflow-hidden shrink-0 border border-[#F0D5D8]">
                      {item.productImage && (
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
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
                <div className="flex justify-between items-center text-xs text-[#9B7B80]">
                  <span>{t('checkout.shipping')}</span>
                  {selectedZone ? (
                    <span className="flex items-center gap-1 text-[#3D1A1E] font-medium nums-normal">
                      <span className="text-[11px]">{selectedZone.icon}</span>
                      {formatPrice(selectedZone.price)}
                    </span>
                  ) : (
                    <span className="text-[#B08A90] italic text-[10px]">{t('checkout.selectToSee')}</span>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#F0D5D8]">
                  <span className="text-xs font-medium text-[#3D1A1E] tracking-wide uppercase">{t('cart.total')}</span>
                  <span className="font-light text-[#6B1F2A]" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}>
                    {formatPrice(Number(cart.totalPrice) + Number(selectedZone?.price || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
