import { Link } from 'react-router-dom'

const WHATSAPP_NUMBER = '972594828117'
const FACEBOOK_URL    = 'https://www.facebook.com/iwear.boutique'
const INSTAGRAM_URL   = 'https://www.instagram.com/iwear1_boutique/'
const WHATSAPP_URL    = `https://wa.me/${WHATSAPP_NUMBER}`

const SHIPPING_ZONES = [
  { region: 'الضفة الغربية',   price: 20, icon: '📦' },
  { region: 'القدس',           price: 30, icon: '🏛️' },
  { region: 'داخل الـ 48',     price: 70, icon: '🚚' },
]

export default function ShippingPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-10">

      {/* Page title */}
      <div className="text-center">
        <h1
          className="text-3xl sm:text-4xl font-light text-[#3D1A1E] mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          التوصيل والدفع
        </h1>
        <p className="text-sm text-[#9B7B80]">كل ما تحتاجين معرفته قبل الطلب</p>
      </div>

      {/* Delivery time banner */}
      <div className="flex items-center gap-4 bg-[#FDF0F2] border border-[#EDD8DC] rounded-2xl px-5 py-4">
        <span className="text-3xl shrink-0">⚡</span>
        <div>
          <p className="font-semibold text-[#3D1A1E]">توصيل سريع خلال 1–2 يوم عمل</p>
          <p className="text-sm text-[#9B7B80] mt-0.5">بعد تأكيد الطلب عبر WhatsApp</p>
        </div>
      </div>

      {/* Shipping prices */}
      <div>
        <h2 className="text-lg font-semibold text-[#3D1A1E] mb-4">أسعار الشحن</h2>
        <div className="bg-white border border-[#EDD8DC] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FDF6F7] border-b border-[#EDD8DC]">
                <th className="text-start px-5 py-3 font-semibold text-[#6B1F2A]">المنطقة</th>
                <th className="text-end px-5 py-3 font-semibold text-[#6B1F2A]">سعر الشحن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9E8EB]">
              {SHIPPING_ZONES.map(z => (
                <tr key={z.region} className="hover:bg-[#FDF6F7] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{z.icon}</span>
                      <span className="font-medium text-[#3D1A1E]">{z.region}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-end">
                    <span className="font-bold text-[#6B1F2A] text-base">₪{z.price}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#9B7B80] mt-3 text-center">
          الشحن مجاني عند الطلبات التي تتجاوز ₪300 داخل الضفة الغربية
        </p>
      </div>

      {/* Payment info */}
      <div>
        <h2 className="text-lg font-semibold text-[#3D1A1E] mb-4">طريقة الدفع</h2>
        <div className="space-y-3">
          {[
            { icon: '💵', title: 'الدفع عند الاستلام', desc: 'ادفعي نقداً عند وصول طلبك' },
            { icon: '📲', title: 'التحويل البنكي', desc: 'يتم إرسال تفاصيل الحساب عبر WhatsApp' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-4 bg-white border border-[#EDD8DC] rounded-2xl px-5 py-4">
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div>
                <p className="font-semibold text-[#3D1A1E] text-sm">{item.title}</p>
                <p className="text-xs text-[#9B7B80] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-lg font-semibold text-[#3D1A1E] mb-4">كيف يعمل؟</h2>
        <ol className="space-y-3">
          {[
            { step: '١', text: 'اختاري المنتجات وأضيفيها للـ Cart' },
            { step: '٢', text: 'أكملي بيانات Checkout' },
            { step: '٣', text: 'سنتواصل معكِ عبر WhatsApp لتأكيد الطلب' },
            { step: '٤', text: 'يصلكِ الطلب خلال 1–2 يوم عمل' },
          ].map(item => (
            <li key={item.step} className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-[#6B1F2A] text-white flex items-center justify-center text-sm font-bold shrink-0">
                {item.step}
              </span>
              <span className="text-sm text-[#3D1A1E]">{item.text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Contact section */}
      <div>
        <h2 className="text-lg font-semibold text-[#3D1A1E] mb-4">تواصلي معنا</h2>
        <div className="space-y-3">
          {/* WhatsApp */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 hover:bg-green-100 transition-colors group"
          >
            <span className="text-2xl shrink-0">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-green-500" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </span>
            <div className="flex-1">
              <p className="font-semibold text-green-800 text-sm">WhatsApp</p>
              <p className="text-xs text-green-600 mt-0.5" dir="ltr">+{WHATSAPP_NUMBER}</p>
            </div>
            <svg className="w-4 h-4 text-green-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Facebook */}
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 hover:bg-blue-100 transition-colors group"
          >
            <span className="text-2xl shrink-0">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-blue-600" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </span>
            <div className="flex-1">
              <p className="font-semibold text-blue-800 text-sm">Facebook</p>
              <p className="text-xs text-blue-600 mt-0.5">IWEAR Boutique</p>
            </div>
            <svg className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Instagram */}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-pink-50 border border-pink-200 rounded-2xl px-5 py-4 hover:bg-pink-100 transition-colors group"
          >
            <span className="text-2xl shrink-0">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-pink-500" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </span>
            <div className="flex-1">
              <p className="font-semibold text-pink-800 text-sm">Instagram</p>
              <p className="text-xs text-pink-600 mt-0.5">@iwear1_boutique</p>
            </div>
            <svg className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-2">
        <Link
          to="/products"
          className="inline-block bg-[#6B1F2A] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#8B2535] transition-colors"
        >
          تسوّقي الآن
        </Link>
      </div>
    </div>
  )
}
