import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Icon } from './Bits'
import { setFilters, resetFilters } from '../redux/products'

const YEAR = new Date().getFullYear()
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password']
const SHOP = [
  { label: 'All products', category: '' },
  { label: 'Vegetables', category: 'Vegetables' },
  { label: 'Fruits', category: 'Fruits' },
  { label: 'Dairy & eggs', category: 'Dairy & Eggs' },
]

const LINKS = {
  guest: [
    { to: '/login', label: 'Login' },
    { to: '/register', label: 'Create an account' },
  ],
  customer: [
    { to: '/orders', label: 'My orders' },
    { to: '/wishlist', label: 'Saved for later' },
    { to: '/following', label: 'Farms I follow' },
    { to: '/profile', label: 'Profile' },
  ],
  farmer: [
    { to: '/farmer', label: 'Dashboard' },
    { to: '/farmer/products/new', label: 'Add a product' },
    { to: '/profile', label: 'Profile' },
  ],
  rider: [
    { to: '/rider', label: 'My deliveries' },
    { to: '/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/admin', label: 'Admin panel' },
    { to: '/profile', label: 'Profile' },
  ],
}

function Footer() {
  const user = useSelector((state) => state.auth.user)
  const mine = LINKS[user ? user.role : 'guest']
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { pathname } = useLocation()
  if (AUTH_PAGES.includes(pathname)) return null

  function shop(category) {
    dispatch(resetFilters())
    if (category) dispatch(setFilters({ category: category }))
    navigate('/')
    window.scrollTo(0, 0)
  }
  return (
    <footer className="mt-12 border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-extrabold text-green-800">
            <span className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center">
              <Icon name="wheat" className="w-5 h-5" />
            </span>
            FarmDirect
          </Link>
          <p className="text-gray-500 mt-3 max-w-xs">
            Farmers sell straight to you. No middlemen, picked the day before delivery, cash on delivery.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Shop</h3>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li>
              <Link to="/farms" className="hover:text-green-700">
                Farms near you
              </Link>
            </li>
            {SHOP.map((c) => (
              <li key={c.label}>
                <button
                  type="button"
                  className="hover:text-green-700 cursor-pointer"
                  onClick={() => shop(c.category)}
                >
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">{user ? 'Your account' : 'Join'}</h3>
          <ul className="flex flex-col gap-2 text-gray-600">
            {mine.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-green-700">
                  {l.label}
                </Link>
              </li>
            ))}
            {!user && (
              <li>
                <Link to="/register" className="hover:text-green-700">
                  Sell your harvest
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-1 justify-between text-xs text-gray-500">
          <p>&copy; {YEAR} FarmDirect &middot; a Web Programming project by Saboor Islam</p>
          <p>Photos from the WordPress Photo Directory (CC0) &middot; icons by icons8</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
