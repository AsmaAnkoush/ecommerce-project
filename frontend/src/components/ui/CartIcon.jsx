import { ShoppingCart } from 'lucide-react'

/**
 * Shared cart icon — thin wrapper around Lucide's ShoppingCart.
 * Use this everywhere a cart icon appears (Navbar, ProductCard, etc.)
 * so the design stays identical across the app.
 *
 * Size is controlled via `className` (Tailwind width/height utilities).
 * strokeWidth defaults to 1.8 to match the product card usage.
 */
export default function CartIcon({ className = 'w-5 h-5', strokeWidth = 1.8 }) {
  return <ShoppingCart className={className} strokeWidth={strokeWidth} />
}
