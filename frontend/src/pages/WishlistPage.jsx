import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import ProductCard from '../components/product/ProductCard'

export default function WishlistPage() {
  const { wishlist } = useWishlist()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-24">
          <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-gray-500 font-medium text-lg">Your wishlist is empty</p>
          <p className="text-sm text-gray-400 mt-1">Save items you love and come back to them later.</p>
          <Link to="/products" className="mt-6 inline-block bg-black text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
