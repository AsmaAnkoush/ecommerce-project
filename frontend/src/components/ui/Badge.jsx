export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default:   'bg-[#F9EEF0]   text-[#6B3840]   border border-[#EDD8DC]',
    success:   'bg-emerald-50  text-emerald-700  border border-emerald-200',
    warning:   'bg-amber-50    text-amber-700    border border-amber-200',
    danger:    'bg-red-50      text-red-700      border border-red-200',
    info:      'bg-sky-50      text-sky-700      border border-sky-200',
    secondary: 'bg-[#FDF0F2]   text-[#9B7B80]   border border-[#EDD8DC]',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${variants[variant] || variants.default}`}>
      {children}
    </span>
  )
}
