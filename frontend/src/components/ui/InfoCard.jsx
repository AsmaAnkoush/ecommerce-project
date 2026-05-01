export default function InfoCard({ title, icon: Icon, items }) {
  return (
    <div className="rounded-xl border border-[#F0D5D8] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FDF8F9] border-b border-[#F0D5D8]">
        {Icon && (
          <Icon className="w-3 h-3 text-[#6B1F2A] shrink-0" strokeWidth={1.8} />
        )}
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#9B7B80]">
          {title}
        </span>
      </div>

      {/* Columns — label row then value row */}
      <div className="bg-white" style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {/* Label row */}
        {items.map((item, i) => (
          <div
            key={`lbl-${i}`}
            className={`flex items-center justify-center gap-1 px-2 pt-2.5 pb-1 border-b border-[#F5E8EA] text-[10px] text-[#6B4E53]${i < items.length - 1 ? ' border-e border-[#F5E8EA]' : ''}`}
          >
            {item.emoji && <span className="text-[11px] leading-none">{item.emoji}</span>}
            <span className="whitespace-nowrap">{item.label}</span>
          </div>
        ))}
        {/* Value row */}
        {items.map((item, i) => (
          <div
            key={`val-${i}`}
            className={`flex items-center justify-center px-2 pt-1 pb-2.5${i < items.length - 1 ? ' border-e border-[#F5E8EA]' : ''}`}
          >
            <span className="text-xs font-bold text-[#6B1F2A] nums-normal" dir="ltr">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
