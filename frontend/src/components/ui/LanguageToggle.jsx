import { useLanguage } from '../../context/LanguageContext'

/**
 * Animated AR ↔ EN language toggle.
 *
 * Looks like a pill switch (similar to a light/dark mode toggle):
 *   ┌─────────────┐
 *   │ ●AR │  EN  │   ← Arabic active
 *   └─────────────┘
 *
 * The slider position is driven by transform translateX, and the toggle is
 * forced to dir="ltr" so the AR/EN order never flips when the page direction
 * changes (otherwise switching to Arabic would visually swap the labels).
 */
export default function LanguageToggle({ className = '' }) {
  const { lang, toggle } = useLanguage()
  const isEn = lang === 'en'

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isEn}
      aria-label={isEn ? 'Switch to Arabic' : 'Switch to English'}
      title={isEn ? 'العربية' : 'English'}
      dir="ltr"
      className={[
        'relative inline-flex items-center justify-between',
        'w-[68px] h-[28px] px-[3px]',
        'rounded-full border border-[#F0D5D8]',
        'bg-[#FDF6F7] hover:bg-[#FBF1F4]',
        'shadow-[0_1px_3px_rgba(107,31,42,0.06)]',
        'transition-colors duration-200 select-none cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFA3AD] focus-visible:ring-offset-1',
        className,
      ].join(' ')}
      style={{ fontFamily: 'Raleway, sans-serif' }}
    >
      {/* Sliding pill */}
      <span
        aria-hidden="true"
        className={[
          'absolute top-[3px] left-[3px]',
          'w-[29px] h-[22px] rounded-full',
          'bg-gradient-to-br from-[#6B1F2A] to-[#8B2A3A]',
          'shadow-[0_2px_8px_rgba(107,31,42,0.3)]',
          'transition-transform duration-300 ease-out',
          isEn ? 'translate-x-[31px]' : 'translate-x-0',
        ].join(' ')}
      />

      {/* AR label */}
      <span
        className={[
          'relative z-10 w-[29px] text-center',
          'text-[10px] font-bold tracking-[0.08em] leading-none',
          'transition-colors duration-300',
          !isEn ? 'text-white' : 'text-[#9B7B80]',
        ].join(' ')}
      >
        AR
      </span>

      {/* EN label */}
      <span
        className={[
          'relative z-10 w-[29px] text-center',
          'text-[10px] font-bold tracking-[0.08em] leading-none',
          'transition-colors duration-300',
          isEn ? 'text-white' : 'text-[#9B7B80]',
        ].join(' ')}
      >
        EN
      </span>
    </button>
  )
}
