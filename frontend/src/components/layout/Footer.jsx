import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { useLanguage } from '../../context/LanguageContext'

const FACEBOOK_URL  = 'https://www.facebook.com/iwear.boutique'
const INSTAGRAM_URL = 'https://www.instagram.com/iwear1_boutique/'

const FloralSeparator = () => (
  <div className="flex items-center gap-4 my-10">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#EDD8DC] to-transparent" />
    <svg width="52" height="16" viewBox="0 0 52 16" fill="none">
      <path d="M26 5 Q24 2 22 5 Q24 8 26 5Z" fill="#E8BDC4" opacity="0.85"/>
      <path d="M26 5 Q28 2 30 5 Q28 8 26 5Z" fill="#E8BDC4" opacity="0.85"/>
      <path d="M26 11 Q24 14 22 11 Q24 8 26 11Z" fill="#E8BDC4" opacity="0.85"/>
      <path d="M26 11 Q28 14 30 11 Q28 8 26 11Z" fill="#E8BDC4" opacity="0.85"/>
      <circle cx="26" cy="8" r="2.5" fill="#DFA3AD" opacity="0.9"/>
      <circle cx="13" cy="8" r="1.5" fill="#E8BDC4" opacity="0.5"/>
      <circle cx="39" cy="8" r="1.5" fill="#E8BDC4" opacity="0.5"/>
      <circle cx="6"  cy="8" r="0.8" fill="#E8BDC4" opacity="0.3"/>
      <circle cx="46" cy="8" r="0.8" fill="#E8BDC4" opacity="0.3"/>
    </svg>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#EDD8DC] to-transparent" />
  </div>
)

export default function Footer() {
  const { siteName, contactWhatsApp } = useSiteSettings()
  const { t } = useLanguage()
  const whatsappNumber = (contactWhatsApp || '972594828117').replace(/\D/g, '')
  const WHATSAPP_URL = `https://wa.me/${whatsappNumber}`

  return (
    <footer className="bg-white border-t border-[#F0D5D8] mt-auto">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 pt-14 pb-8">

        {/* Brand block */}
        <div className="text-center mb-10">
          <p
            className="text-[26px] font-light tracking-[0.4em] text-[#6B1F2A] leading-none mb-1"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            I Wear
          </p>
          <p className="text-[9px] tracking-[0.3em] text-[#DFA3AD] uppercase font-light mt-1">
            {t('footer.boutiqueCollection')}
          </p>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-center mb-10">
          <div>
            <h4 className="text-[9px] tracking-[0.22em] uppercase text-[#6B1F2A] font-semibold mb-4">{t('footer.shop')}</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/products',              label: t('footer.allProducts') },
                { to: '/products?bestSeller=true', label: t('footer.bestSellers') },
                { to: '/wishlist',              label: t('footer.wishlist') },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-[11px] font-light text-[#9B7B80] hover:text-[#6B1F2A] transition-colors tracking-wider">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[9px] tracking-[0.22em] uppercase text-[#6B1F2A] font-semibold mb-4">{t('footer.myAccount')}</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/login',    label: t('footer.signIn') },
                { to: '/register', label: t('footer.createAccount') },
                { to: '/orders',   label: t('footer.myOrders') },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-[11px] font-light text-[#9B7B80] hover:text-[#6B1F2A] transition-colors tracking-wider">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-[9px] tracking-[0.22em] uppercase text-[#6B1F2A] font-semibold mb-4">{t('footer.contactUs')}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/about" className="text-[11px] font-light text-[#9B7B80] hover:text-[#6B1F2A] transition-colors tracking-wider">
                  {t('footer.aboutUs')}
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-[11px] font-light text-[#9B7B80] hover:text-[#6B1F2A] transition-colors tracking-wider">
                  {t('footer.deliveryPayment')}
                </Link>
              </li>
              {[
                { href: WHATSAPP_URL, label: 'WhatsApp', hoverColor: 'hover:text-green-600' },
                { href: FACEBOOK_URL, label: 'Facebook',  hoverColor: 'hover:text-blue-600' },
                { href: INSTAGRAM_URL, label: 'Instagram', hoverColor: 'hover:text-pink-600' },
              ].map(({ href, label, hoverColor }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className={`text-[11px] font-light text-[#9B7B80] ${hoverColor} transition-colors tracking-wider`}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social icon row */}
        <div className="flex justify-center gap-3 mb-2">
          {[
            {
              href: WHATSAPP_URL, label: 'WhatsApp',
              hoverBg: 'hover:bg-green-50 hover:border-green-200',
              path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
            },
            {
              href: FACEBOOK_URL, label: 'Facebook',
              hoverBg: 'hover:bg-blue-50 hover:border-blue-200',
              path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
            },
            {
              href: INSTAGRAM_URL, label: 'Instagram',
              hoverBg: 'hover:bg-pink-50 hover:border-pink-200',
              path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
            },
          ].map(({ href, label, hoverBg, path }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={`w-9 h-9 rounded-full flex items-center justify-center bg-[#FDF0F2] border border-[#EDD8DC] ${hoverBg} transition-all duration-200 hover:scale-105`}
            >
              <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] fill-[#9B7B80]">
                <path d={path} />
              </svg>
            </a>
          ))}
        </div>

        <FloralSeparator />

        {/* Return & exchange policy strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6">
          <span className="flex items-center gap-1.5 text-[10px] text-[#B08A90] tracking-wide">
            <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <svg className="w-2 h-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
            {t('footer.noReturns')}
          </span>
          <span className="w-px h-3 bg-[#EDD8DC] hidden sm:block" />
          <span className="flex items-center gap-1.5 text-[10px] text-[#B08A90] tracking-wide">
            <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <svg className="w-2 h-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </span>
            {t('footer.exchangePolicy')}
          </span>
        </div>

        <p className="text-center text-[9px] tracking-[0.22em] text-[#C4A0A6] uppercase font-light">
          &copy; {new Date().getFullYear()} I Wear {t('footer.copyright')}
        </p>
      </div>
    </footer>
  )
}
