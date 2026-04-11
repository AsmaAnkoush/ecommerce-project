import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { UIProvider, useUI } from './context/UIContext'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import MobileBottomNav from './components/layout/MobileBottomNav'
import AdminLayout from './components/layout/AdminLayout'
import AuthDrawer from './components/auth/AuthDrawer'
import AuthBusBridge from './components/auth/AuthBusBridge'
import CartDrawer from './components/cart/CartDrawer'
import QuickView from './components/product/QuickView'
import FloatingWhatsApp from './components/ui/FloatingWhatsApp'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './routes/ProtectedRoute'

import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import OffersPage from './pages/OffersPage'
import AboutPage from './pages/AboutPage'
import NewArrivalsPage from './pages/NewArrivalsPage'
import BestSellersPage from './pages/BestSellersPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import ProfilePage from './pages/ProfilePage'
import WishlistPage from './pages/WishlistPage'
import ShippingPage from './pages/ShippingPage'

/* Old /login and /register URLs now redirect home and open the unified
   AuthDrawer instead. The drawer renders <AuthForms /> directly — there
   are no longer any standalone LoginPage / RegisterPage components. */
function LoginRedirect() {
  const { openLogin } = useUI()
  useEffect(() => { openLogin() }, [openLogin])
  return <Navigate to="/" replace />
}
function RegisterRedirect() {
  const { openRegister } = useUI()
  useEffect(() => { openRegister() }, [openRegister])
  return <Navigate to="/" replace />
}

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
    <div className="min-h-screen flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <Navbar />
      <main className="flex-1 min-w-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <AuthDrawer />
      <AuthBusBridge />
      <CartDrawer />
      <QuickView />
      <FloatingWhatsApp />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <UIProvider>
        <SiteSettingsProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <ToastProvider>
                <Routes>
                  {/* Store routes */}
                  <Route path="/" element={<StoreLayout><HomePage /></StoreLayout>} />
                  <Route path="/products" element={<StoreLayout><ProductsPage /></StoreLayout>} />
                  <Route path="/products/:id" element={<StoreLayout><ProductDetailPage /></StoreLayout>} />
                  <Route path="/offers" element={<StoreLayout><OffersPage /></StoreLayout>} />
                  <Route path="/new-arrivals" element={<StoreLayout><NewArrivalsPage /></StoreLayout>} />
                  <Route path="/best-sellers" element={<StoreLayout><BestSellersPage /></StoreLayout>} />
                  <Route path="/about" element={<StoreLayout><AboutPage /></StoreLayout>} />
                  <Route path="/login" element={<StoreLayout><LoginRedirect /></StoreLayout>} />
                  <Route path="/register" element={<StoreLayout><RegisterRedirect /></StoreLayout>} />

                  <Route path="/cart" element={<StoreLayout><CartPage /></StoreLayout>} />
                  <Route path="/checkout" element={<StoreLayout><CheckoutPage /></StoreLayout>} />
                  <Route path="/orders" element={<StoreLayout><OrdersPage /></StoreLayout>} />
                  <Route path="/orders/:id" element={<StoreLayout><OrderDetailPage /></StoreLayout>} />
                  <Route path="/profile" element={<StoreLayout><ProtectedRoute><ProfilePage /></ProtectedRoute></StoreLayout>} />
                  <Route path="/wishlist" element={<StoreLayout><WishlistPage /></StoreLayout>} />
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
                </ToastProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SiteSettingsProvider>
        </UIProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
