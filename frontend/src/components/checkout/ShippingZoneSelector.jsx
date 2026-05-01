import { useLanguage } from '../../context/LanguageContext'
import { useFormatPrice } from '../../utils/formatPrice'

export default function ShippingZoneSelector({ zones, selectedId, onChange, hasError }) {
  const { language, t } = useLanguage()
  const formatPrice = useFormatPrice()

  return (
    <div
      className={[
        'rounded-xl overflow-hidden border transition-colors duration-200',
        hasError ? 'border-red-300' : 'border-[#EDD8DC]',
      ].join(' ')}
    >
      {zones.map((zone, idx) => {
        const selected = zone.id === selectedId
        const name = language === 'ar' ? zone.nameAr : zone.nameEn
        const isLast = idx === zones.length - 1

        return (
          <label
            key={zone.id}
            className={[
              'flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-200',
              !isLast ? 'border-b border-[#F0D5D8]' : '',
              selected ? 'bg-[#FDF0F1]' : 'bg-white hover:bg-[#FDF8F9]',
            ].join(' ')}
          >
            <input
              type="radio"
              name="shippingZone"
              value={zone.id}
              checked={selected}
              onChange={() => onChange(zone)}
              className="sr-only"
            />

            {/* Radio dot */}
            <span
              className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
              style={{ borderColor: selected ? '#8B2F3A' : '#D4ADB3' }}
            >
              {selected && (
                <span className="w-2 h-2 rounded-full bg-[#8B2F3A]" />
              )}
            </span>

            {/* Icon */}
            <span className="text-base leading-none shrink-0 w-5 text-center">{zone.icon}</span>

            {/* Name */}
            <span
              className={[
                'flex-1 text-sm transition-colors duration-200',
                selected ? 'font-semibold text-[#3D1A1E]' : 'font-medium text-[#6B4E53]',
              ].join(' ')}
            >
              {name}
            </span>

            {/* Price + delivery */}
            <div className="text-end shrink-0">
              <p
                className={[
                  'text-sm font-bold nums-normal transition-colors duration-200',
                  selected ? 'text-[#8B2F3A]' : 'text-[#9B7B80]',
                ].join(' ')}
              >
                {formatPrice(zone.price)}
              </p>
              {zone.deliveryDays && (
                <p className="text-[10px] text-[#9B7B80] mt-0.5 leading-none">
                  {zone.deliveryDays} {t('checkout.days')}
                </p>
              )}
            </div>
          </label>
        )
      })}
    </div>
  )
}
