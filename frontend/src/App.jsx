import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { UIProvider } from './context/UIContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import AdminLayout from './components/layout/AdminLayout'
import ProtectedRoute from './routes/ProtectedRoute'

import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import WishlistPage from './pages/WishlistPage'
import ShippingPage from './pages/ShippingPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOffers from './pages/admin/AdminOffers'
import AdminSettings from './pages/admin/AdminSettings'
import AdminUsers from './pages/admin/AdminUsers'
import AdminReviews from './pages/admin/AdminReviews'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'

function StoreLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 min-w-0">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <UIProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <Routes>
                  {/* Store routes */}
                  <Route path="/" element={<StoreLayout><HomePage /></StoreLayout>} />
                  <Route path="/products" element={<StoreLayout><ProductsPage /></StoreLayout>} />
                  <Route path="/products/:id" element={<StoreLayout><ProductDetailPage /></StoreLayout>} />
                  <Route path="/login" element={<StoreLayout><LoginPage /></StoreLayout>} />
                  <Route path="/register" element={<StoreLayout><RegisterPage /></StoreLayout>} />

                  <Route path="/cart" element={<StoreLayout><CartPage /></StoreLayout>} />
                  <Route path="/checkout" element={<StoreLayout><CheckoutPage /></StoreLayout>} />
                  <Route path="/orders" element={<StoreLayout><ProtectedRoute><OrdersPage /></ProtectedRoute></StoreLayout>} />
                  <Route path="/orders/:id" element={<StoreLayout><ProtectedRoute><OrderDetailPage /></ProtectedRoute></StoreLayout>} />
                  <Route path="/profile" element={<StoreLayout><ProtectedRoute><ProfilePage /></ProtectedRoute></StoreLayout>} />
                  <Route path="/wishlist" element={<StoreLayout><ProtectedRoute><WishlistPage /></ProtectedRoute></StoreLayout>} />
                  <Route path="/shipping" element={<StoreLayout><ShippingPage /></StoreLayout>} />

                  {/* Admin routes */}
                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/products" element={<ProtectedRoute adminOnly><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/products/new" element={<ProtectedRoute adminOnly><AdminLayout><AdminProductForm /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/products/:id/edit" element={<ProtectedRoute adminOnly><AdminLayout><AdminProductForm /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/categories" element={<ProtectedRoute adminOnly><AdminLayout><AdminCategories /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/orders/:id" element={<ProtectedRoute adminOnly><AdminLayout><AdminOrderDetail /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/reviews" element={<ProtectedRoute adminOnly><AdminLayout><AdminReviews /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/offers" element={<ProtectedRoute adminOnly><AdminLayout><AdminOffers /></AdminLayout></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </UIProvider>
    </BrowserRouter>
  )
}
