export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-[#6B3840]">{label}</label>
      )}
      <input
        className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors bg-white
          ${error
            ? 'border-red-300 focus:border-red-500'
            : 'border-[#EDD8DC] focus:border-[#6B1F2A]'
          }
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
