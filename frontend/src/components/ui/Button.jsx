export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, ...props }) {
  const base = [
    'inline-flex items-center justify-center font-medium rounded-xl',
    'transition-all duration-250 cursor-pointer',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'tracking-[0.08em] select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFA3AD] focus-visible:ring-offset-2',
  ].join(' ')

  const variants = {
    primary: [
      'bg-[#6B1F2A] text-white',
      'hover:bg-[#7D2432] active:bg-[#5A1822]',
      'shadow-[0_2px_12px_rgba(107,31,42,0.22)]',
      'hover:shadow-[0_4px_20px_rgba(107,31,42,0.32)]',
      'active:shadow-[0_1px_6px_rgba(107,31,42,0.15)]',
      'active:scale-[0.98]',
    ].join(' '),

    secondary: [
      'bg-white text-[#6B1F2A]',
      'border border-[#DFA3AD] hover:border-[#6B1F2A]',
      'hover:bg-[#FDF0F2] active:bg-[#F5DCE0]',
      'shadow-[0_1px_4px_rgba(107,31,42,0.08)]',
      'hover:shadow-[0_3px_12px_rgba(107,31,42,0.12)]',
      'active:scale-[0.98]',
    ].join(' '),

    danger: [
      'bg-red-500 text-white',
      'hover:bg-red-600 active:bg-red-700',
      'shadow-sm hover:shadow-md',
      'active:scale-[0.98]',
    ].join(' '),

    ghost: [
      'text-[#6B1F2A]',
      'hover:bg-[#FDF0F2] active:bg-[#F5DCE0]',
      'active:scale-[0.98]',
    ].join(' '),
  }

  const sizes = {
    sm: 'px-4 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-sm gap-2',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
