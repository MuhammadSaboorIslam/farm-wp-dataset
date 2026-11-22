import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearMessage } from './redux/ui'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { Loader } from './components/Bits'

const FarmerDashboard = lazy(() => import('./pages/FarmerDashboard'))
const Rider = lazy(() => import('./pages/Rider'))
const Admin = lazy(() => import('./pages/Admin'))
import ProtectedPath from './components/ProtectedPath'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Farm from './pages/Farm'
import Cart from './pages/Cart'
import MyOrders from './pages/MyOrders'
import OrderDetails from './pages/OrderDetails'
import Following from './pages/Following'
import ProductForm from './pages/ProductForm'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Wishlist from './pages/Wishlist'
import Farms from './pages/Farms'

function App() {
  const dispatch = useDispatch()
  const message = useSelector((state) => state.ui.message)
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/farms/:id" element={<Farm />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route
                path="/cart"
                element={
                  <ProtectedPath roles={['customer']}>
                    <Cart />
                  </ProtectedPath>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedPath roles={['customer']}>
                    <MyOrders />
                  </ProtectedPath>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedPath>
                    <OrderDetails />
                  </ProtectedPath>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedPath roles={['customer']}>
                    <Wishlist />
                  </ProtectedPath>
                }
              />
              <Route path="/farms" element={<Farms />} />
              <Route
                path="/following"
                element={
                  <ProtectedPath roles={['customer']}>
                    <Following />
                  </ProtectedPath>
                }
              />

              <Route
                path="/farmer"
                element={
                  <ProtectedPath roles={['farmer']}>
                    <FarmerDashboard />
                  </ProtectedPath>
                }
              />
              <Route
                path="/farmer/products/new"
                element={
                  <ProtectedPath roles={['farmer']}>
                    <ProductForm />
                  </ProtectedPath>
                }
              />
              <Route
                path="/farmer/products/:id/edit"
                element={
                  <ProtectedPath roles={['farmer']}>
                    <ProductForm />
                  </ProtectedPath>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedPath>
                    <Profile />
                  </ProtectedPath>
                }
              />

              <Route
                path="/rider"
                element={
                  <ProtectedPath roles={['rider']}>
                    <Rider />
                  </ProtectedPath>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedPath roles={['admin']}>
                    <Admin />
                  </ProtectedPath>
                }
              />

              <Route path="*" element={<p className="empty">Page not found</p>} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
      {message && (
        <div
          className={
            'fixed bottom-4 right-4 px-4 py-3 rounded shadow-lg text-white cursor-pointer z-40 ' +
            (message.type === 'warn' ? 'bg-yellow-600' : 'bg-green-700')
          }
          onClick={() => dispatch(clearMessage())}
        >
          {message.text}
        </div>
      )}
    </BrowserRouter>
  )
}

export default App
