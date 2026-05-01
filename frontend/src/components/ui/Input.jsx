import { useState } from 'react'

const EyeOpenIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
)

/**
 * Generic styled text input.
 *
 * Optional `icon` prop renders an SVG inside the field on the start side.
 * When `type="password"`, an eye-toggle button is automatically injected on
 * the end side, switching the input between "password" and "text" visibility.
 * Both decorations are RTL-aware via Tailwind's start-* / end-* / ps-* / pe-*.
 */
export default function Input({ label, error, icon, className = '', ...props }) {
  const isPassword = props.type === 'password'
  const [showPassword, setShowPassword] = useState(false)

  const { type, ...restProps } = props
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type

  const inputClasses = [
    'w-full px-4 py-3 rounded-xl text-sm text-[#3D1A1E] bg-white',
    'border transition-all duration-200 outline-none placeholder:text-[#C4A0A6]',
    'input-focus-glow',
    error
      ? 'border-red-300 focus:border-red-500'
      : 'border-[#EDD8DC] focus:border-[#DFA3AD]',
    icon ? 'ps-11' : '',
    isPassword ? 'pe-11' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold tracking-[0.08em] uppercase text-[#6B3840]">
          {label}
        </label>
      )}
      {icon || isPassword ? (
        <div className="relative">
          {icon && (
            <span className="absolute inset-y-0 start-0 flex items-center ps-3.5 text-[#C4A0A6] pointer-events-none">
              {icon}
            </span>
          )}
          <input className={inputClasses} type={effectiveType} {...restProps} />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-[#C4A0A6] hover:text-[#6B1F2A] active:scale-90 transition-all duration-150"
            >
              {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
            </button>
          )}
        </div>
      ) : (
        <input className={inputClasses} type={effectiveType} {...restProps} />
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
