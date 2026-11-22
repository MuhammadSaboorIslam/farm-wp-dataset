import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser } from '../redux/auth'
import { cartCount } from '../redux/cart'
import { loadNotifications, markAllRead, clearNotifications } from '../redux/notifications'
import { loadWishlist } from '../redux/wishlist'
import { setFilters, resetFilters } from '../redux/products'
import { ShortDate } from '../helpers'
import { Icon } from './Bits'
import { io } from 'socket.io-client'
import { post } from '../api'

const ROLE_LINE = { customer: 'Customer', farmer: 'Farmer', rider: 'Rider', admin: 'Admin' }

const ROLE_LINKS = {
  customer: [{ to: '/orders', label: 'My Orders' }],
  farmer: [{ to: '/farmer', label: 'Dashboard' }],
  rider: [{ to: '/rider', label: 'Deliveries' }],
  admin: [{ to: '/admin', label: 'Admin' }],
}

const MENU_LINKS = {
  customer: [
    { to: '/wishlist', label: 'Saved for later', count: true },
    { to: '/following', label: 'Farms I follow' },
    { to: '/orders', label: 'My orders' },
  ],
  farmer: [
    { to: '/farmer', label: 'Dashboard' },
    { to: '/farmer/products/new', label: 'Add a product' },
  ],
  rider: [{ to: '/rider', label: 'Deliveries and earnings' }],
  admin: [{ to: '/admin', label: 'Admin panel' }],
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M12 2a6 6 0 0 0-6 6v3.6L4.3 15a1 1 0 0 0 .9 1.5h13.6a1 1 0 0 0 .9-1.5L18 11.6V8a6 6 0 0 0-6-6zm0 20a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z" />
    </svg>
  )
}

function SearchIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function Navbar() {
  const user = useSelector((state) => state.auth.user)
  const count = useSelector(cartCount)
  const { list, unread } = useSelector((state) => state.notifications)
  const saved = useSelector((state) => state.wishlist.ids.length)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [account, setAccount] = useState(false)
  const [menu, setMenu] = useState(false)
  const [q, setQ] = useState('')
  const bellRef = useRef(null)
  const phoneBellRef = useRef(null)
  const accountRef = useRef(null)

  useEffect(()=>{
    if (user && user.role === 'customer') dispatch(loadWishlist())
  }, [user, dispatch])

  useEffect(()=>{
    if (user) {
      dispatch(loadNotifications())
    } else {
      dispatch(clearNotifications())
    }
  }, [user, location.pathname, dispatch])

  useEffect(()=>{
    if (!user) {
      return
    }
    const socket = io()
    socket.on('notification', () => dispatch(loadNotifications()))
    return () => socket.disconnect()
  }, [user, dispatch])

  useEffect(()=>{
    if (!open && !account) return
    function outside(e) {
      const inBell = [bellRef, phoneBellRef].some((r) => r.current && r.current.contains(e.target))
      if (open && !inBell) setOpen(false)
      if (account && accountRef.current && !accountRef.current.contains(e.target)) setAccount(false)
    }
    function esc(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        setAccount(false)
      }
    }
    document.addEventListener('mousedown', outside)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', outside)
      document.removeEventListener('keydown', esc)
    }
  }, [open, account])

  function closeall() {
    setMenu(false)
    setOpen(false)
    setAccount(false)
  }

  function navclick(e) {
    if (e.target.closest('a')) closeall()
  }

  function Logout() {
    closeall()
    post('/auth/logout').catch(() => {})
    dispatch(logoutUser())
    navigate('/')
  }

  function ToggleBell() {
    if (!open) {
      dispatch(loadNotifications())
    }
    setAccount(false)
    setOpen(!open)
  }

  function opennotification(n) {
    closeall()
    navigate(n.link)
  }

  function search(e) {
    e.preventDefault()
    dispatch(resetFilters())
    if (q.trim()) dispatch(setFilters({ q: q.trim() }))
    closeall()
    navigate('/')
    window.scrollTo(0, 0)
  }

  function linkclass({ isActive }) {
    return 'navlink ' + (isActive ? 'active' : '')
  }

  const items = []
  for (let i = 0; i < list.length && i < 8; i++) {
    const n = list[i]
    items.push(
      <li
        key={n.id}
        className={
          'px-4 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ' +
          (n.read ? 'text-gray-500' : 'font-medium')
        }
        onClick={() => opennotification(n)}
      >
        <p className="text-sm">{n.text}</p>
        <p className="text-xs text-gray-400">{ShortDate(n.createdAt)}</p>
      </li>,
    )
  }

  const roleLinks = user ? ROLE_LINKS[user.role] : []
  const mainLinks = (
    <>
      <NavLink to="/" end className={linkclass}>
        Products
      </NavLink>
      <NavLink to="/farms" className={linkclass}>
        Farms
      </NavLink>
      {roleLinks.map((l) => (
        <NavLink key={l.to} to={l.to} className={linkclass}>
          {l.label}
        </NavLink>
      ))}
      {user && user.role === 'customer' && (
        <NavLink to="/wishlist" className={linkclass}>
          Saved{saved > 0 ? ' (' + saved + ')' : ''}
        </NavLink>
      )}
    </>
  )

  const searchBox = (wide) => (
    <form
      onSubmit={search}
      className={
        'flex items-center rounded-lg bg-white/15 focus-within:bg-white focus-within:text-gray-800 text-green-50 transition ' +
        (wide ? 'w-full' : 'w-44 lg:w-52')
      }
    >
      <SearchIcon className="w-4 h-4 ml-3 shrink-0" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search"
        className="w-full bg-transparent px-2 py-2 text-sm placeholder-green-100 focus:placeholder-gray-400 focus:outline-none"
      />
    </form>
  )

  const bell = (ref) =>
    user && (
      <div className="relative" ref={ref}>
        <button
          className="relative p-2 rounded-lg hover:bg-white/10 cursor-pointer text-white"
          onClick={ToggleBell}
          title="Notifications"
        >
          <BellIcon />
          {unread > 0 && <span className="badge">{unread}</span>}
        </button>
        {open && (
          <div className="dropdown">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 text-sm font-semibold">
              <span>Notifications</span>
              {unread > 0 && (
                <button
                  className="link text-xs font-normal cursor-pointer"
                  onClick={() => dispatch(markAllRead())}
                >
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 && <p className="muted px-4 py-4">Nothing yet</p>}
            <ul className="max-h-80 overflow-y-auto">{items}</ul>
          </div>
        )}
      </div>
    )

  const cart = user && user.role === 'customer' && (
    <Link to="/cart" className="relative p-2 rounded-lg hover:bg-white/10" title="Cart" onClick={closeall}>
      <Icon name="cart-white" className="w-6 h-6" />
      {count > 0 && <span className="badge">{count}</span>}
    </Link>
  )

  const menuLinks = user ? MENU_LINKS[user.role] : []

  return (
    <header className="bar">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
        <Link to="/" className="flex items-center gap-2 text-white shrink-0" onClick={closeall}>
          <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Icon name="wheat" className="w-6 h-6" />
          </span>
          <span className="leading-none">
            <span className="block text-xl font-extrabold">FarmDirect</span>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-green-200 mt-1">
              {user ? ROLE_LINE[user.role] : 'Farm to your door'}
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" onClick={navclick}>
          {mainLinks}
        </nav>

        <div className="hidden md:flex items-center gap-1">
          {searchBox(false)}
          {cart}
          {bell(bellRef)}
          {user ? (
            <div className="relative ml-1" ref={accountRef}>
              <button
                className="w-9 h-9 rounded-full bg-white text-green-800 font-bold flex items-center justify-center cursor-pointer ring-2 ring-transparent hover:ring-white/40"
                onClick={() => {
                  setOpen(false)
                  setAccount(!account)
                }}
                title="Your account"
              >
                {user.name[0].toUpperCase()}
              </button>
              {account && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 py-2 text-sm z-40"
                  onClick={navclick}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" className="flex px-4 py-2 hover:bg-gray-50">
                    Profile
                  </Link>
                  {menuLinks.map((l) => (
                    <Link key={l.to} to={l.to} className="flex justify-between px-4 py-2 hover:bg-gray-50">
                      {l.label}
                      {l.count && saved > 0 && <span className="text-gray-400">{saved}</span>}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={Logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Icon name="logout" className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login" className={linkclass}>
                Login
              </NavLink>
              <Link
                to="/register"
                className="ml-1 bg-white text-green-800 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-50"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
          {cart}
          {bell(phoneBellRef)}
          <button
            className="p-2 rounded-lg hover:bg-white/10 cursor-pointer text-white"
            onClick={() => {
              setOpen(false)
              setMenu(!menu)
            }}
            title="Menu"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menu ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menu && (
        <nav
          className="md:hidden border-t border-white/10 bg-green-900 px-4 py-3 flex flex-col gap-1"
          onClick={navclick}
        >
          <div className="mb-2">{searchBox(true)}</div>
          {mainLinks}
          <div className="border-t border-white/10 mt-2 pt-2 flex flex-col gap-1">
            {user ? (
              <>
                <p className="px-3 pt-1 pb-2 text-xs text-green-200">
                  {user.name} &middot; {user.email}
                </p>
                <NavLink to="/profile" className={linkclass}>
                  Profile
                </NavLink>
                {menuLinks
                  .filter((l) => !roleLinks.some((r) => r.to === l.to) && l.to !== '/wishlist')
                  .map((l) => (
                    <NavLink key={l.to} to={l.to} className={linkclass}>
                      {l.label}
                    </NavLink>
                  ))}
                <button onClick={Logout} className="navlink text-left text-red-200 cursor-pointer">
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkclass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={linkclass}>
                  Register
                </NavLink>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}

export default Navbar
