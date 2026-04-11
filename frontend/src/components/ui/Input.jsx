/**
 * Generic styled text input.
 *
 * Optional `icon` prop renders an SVG inside the field on the start side.
 * The icon is purely decorative — `pointer-events-none` keeps clicks
 * focused on the input. The input gets `ps-11` padding so the text never
 * collides with the glyph. RTL-aware via Tailwind's `start-*` / `ps-*`.
 */
export default function Input({ label, error, icon, className = '', ...props }) {
  const inputClasses = [
    'w-full px-4 py-3 rounded-xl text-sm text-[#3D1A1E] bg-white',
    'border transition-all duration-200 outline-none placeholder:text-[#C4A0A6]',
    'input-focus-glow',
    error
      ? 'border-red-300 focus:border-red-500'
      : 'border-[#EDD8DC] focus:border-[#DFA3AD]',
    icon ? 'ps-11' : '',
    className,
  ].filter(Boolean).join(' ')

  const inputElement = <input className={inputClasses} {...props} />

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold tracking-[0.08em] uppercase text-[#6B3840]">
          {label}
        </label>
      )}
      {icon ? (
        <div className="relative">
          <span className="absolute inset-y-0 start-0 flex items-center ps-3.5 text-[#C4A0A6] pointer-events-none">
            {icon}
          </span>
          {inputElement}
        </div>
      ) : (
        inputElement
      )}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
