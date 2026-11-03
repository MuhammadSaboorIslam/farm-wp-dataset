import {BrowserRouter,Routes,Route} from 'react-router-dom'
import {useDispatch,useSelector} from 'react-redux'
import {clearMessage} from './redux/ui'
import Navbar from './components/Navbar'
import ProtectedPath from './components/ProtectedPath'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Farm from './pages/Farm'
import Cart from './pages/Cart'
import MyOrders from './pages/MyOrders'
import OrderDetails from './pages/OrderDetails'
import Following from './pages/Following'
import FarmerDashboard from './pages/FarmerDashboard'
import ProductForm from './pages/ProductForm'
import Rider from './pages/Rider'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const dispatch=useDispatch();
  const message=useSelector(state =>state.ui.message);
  return (
      <BrowserRouter>
        <Navbar />
     <main className='max-w-6xl mx-auto px-4 py-6'>
       <Routes>
          <Route path="/" element={<Products/>} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/farms/:id" element={<Farm />} />
           <Route path="/login" element={<Login/>} />
           <Route path="/register"  element={<Register />} />

          <Route path="/cart" element={<ProtectedPath roles={['customer']}><Cart /></ProtectedPath>} />
          <Route path="/orders" element={<ProtectedPath roles={['customer']}><MyOrders /></ProtectedPath>} />
          <Route path="/orders/:id" element={<ProtectedPath><OrderDetails /></ProtectedPath>} />
          <Route path="/following" element={<ProtectedPath roles={['customer']}><Following /></ProtectedPath>} />

          <Route path="/farmer" element={<ProtectedPath roles={['farmer']}><FarmerDashboard /></ProtectedPath>} />
          <Route path="/farmer/products/new" element={<ProtectedPath roles={['farmer']}><ProductForm /></ProtectedPath>} />
          <Route path="/farmer/products/:id/edit" element={<ProtectedPath roles={['farmer']}><ProductForm /></ProtectedPath>} />

          <Route path="/rider" element={<ProtectedPath roles={['rider']}><Rider /></ProtectedPath>} />
          <Route path="/admin" element={<ProtectedPath roles={['admin']}><Admin /></ProtectedPath>} />

          <Route path="*"  element={<p className="empty">Page not found</p>}/>
        </Routes>
      </main>
        {message&&(
        <div className={'fixed bottom-4 right-4 px-4 py-3 rounded shadow-lg text-white cursor-pointer z-40 ' + (message.type === 'warn' ? 'bg-yellow-600' : 'bg-green-700')} onClick={()=>dispatch(clearMessage())}>
            {message.text}
        </div>
      )}
    </BrowserRouter>
  )
}

export default App
