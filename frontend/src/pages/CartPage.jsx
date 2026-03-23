import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart()
  const navigate = useNavigate()

  if (loading) {
    return <div className="flex justify-center py-40"><Spinner size="lg" /></div>
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <svg className="w-24 h-24 text-[#EDD8DC] mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h2 className="text-2xl font-light text-[#3D1A1E] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Cart فارغ</h2>
        <p className="text-[#9B7B80] text-sm mb-8">أضيفي قطعاً رائعة لتبدئي التسوّق</p>
        <Button size="lg" onClick={() => navigate('/products')}>تسوّقي الآن</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-light text-[#3D1A1E] mb-8" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Cart</h1>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Items */}
        <div className="flex-1 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-3 sm:gap-4 bg-white rounded-2xl p-3 sm:p-4 shadow-sm">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#FDF0F2] rounded-xl overflow-hidden shrink-0">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.productId}`} className="font-medium text-[#3D1A1E] hover:text-[#6B1F2A] text-sm line-clamp-2 transition-colors">
                  {item.productName}
                </Link>
                <p className="text-sm text-gray-500 mt-1">₪{Number(item.unitPrice).toFixed(0)} للقطعة</p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-[#EDD8DC] rounded-xl overflow-hidden">
                    <button
                      onClick={() => updateItem(item.id, item.quantity - 1)}
                      className="px-2.5 py-1.5 text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors text-sm"
                    >
                      −
                    </button>
                    <span className="px-3 py-1.5 text-sm font-semibold text-[#3D1A1E]">{item.quantity}</span>
                    <button
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      className="px-2.5 py-1.5 text-[#9B7B80] hover:text-[#6B1F2A] hover:bg-[#FDF0F2] transition-colors text-sm"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-gray-900">₪{Number(item.subtotal).toFixed(0)}</p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="حذف"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-light text-[#3D1A1E] mb-5" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}>ملخص الطلب</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-[#9B7B80]">
                <span>({cart.totalItems}) قطعة</span>
                <span>₪{Number(cart.totalPrice).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[#9B7B80]">
                <span>الشحن</span>
                <span className="text-green-600 font-medium">مجاني</span>
              </div>
              <div className="border-t border-[#F0D5D8] pt-3 flex justify-between font-semibold text-[#3D1A1E] text-base">
                <span>الإجمالي</span>
                <span className="text-[#6B1F2A]">₪{Number(cart.totalPrice).toFixed(0)}</span>
              </div>
            </div>
            <Button size="lg" className="w-full mt-6" onClick={() => navigate('/checkout')}>
              Checkout الآن
            </Button>
            <Button variant="ghost" size="md" className="w-full mt-2 text-gray-500" onClick={() => navigate('/products')}>
              متابعة التسوّق
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
