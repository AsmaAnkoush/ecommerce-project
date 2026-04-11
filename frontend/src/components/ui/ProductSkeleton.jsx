/**
 * Skeleton placeholder that mimics the ProductCard shape while products load.
 *
 * Renders a pulsing placeholder card with:
 *  - A 3/4-aspect rectangle for the image
 *  - Two text lines for the name
 *  - A shorter line for the price
 *
 * Usage:
 *   <div className="grid grid-cols-2 …">
 *     {Array.from({ length: 8 }, (_, i) => <ProductSkeleton key={i} />)}
 *   </div>
 */
export default function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(107,31,42,0.06)' }}>
      {/* Image placeholder */}
      <div className="aspect-[3/4] bg-[#F5E8EA] animate-shimmer-pulse" />

      {/* Info placeholder */}
      <div className="px-4 pt-4 pb-4 space-y-3">
        {/* Name line 1 */}
        <div className="h-3 bg-[#F0D5D8] rounded-full w-full animate-shimmer-pulse" />
        {/* Name line 2 */}
        <div className="h-3 bg-[#F0D5D8] rounded-full w-3/4 animate-shimmer-pulse" />
        {/* Price */}
        <div className="h-4 bg-[#EDD8DC] rounded-full w-1/2 animate-shimmer-pulse" />
      </div>
    </div>
  )
}
