import {useState,useEffect} from "react";
import {Link,NavLink,useNavigate,useLocation} from "react-router-dom";
import {useSelector,useDispatch} from "react-redux";
import {logoutUser} from "../redux/auth";
import {cartCount} from "../redux/cart";
import {loadNotifications,markAllRead,clearNotifications} from "../redux/notifications";
import {ShortDate} from "../helpers";

function Navbar() {
  const user = useSelector((state) => state.auth.user);
  const count = useSelector(cartCount)
  const { list, unread } = useSelector(state => state.notifications)
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation()
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    if (user){
      dispatch(loadNotifications())
    } else {
      dispatch(clearNotifications())
    }
  }, [user, location.pathname, dispatch])

  function navClick(e){
    if (e.target.closest('a')){
      setMenu(false)
      setOpen(false)
    }
  }

  function Logout() {
    dispatch(logoutUser());
    navigate("/");
  }

  function toggleBell(){
    if (!open){
      dispatch(loadNotifications())
    }
    setOpen(!open)
  }

  function openNotification(n){
    setOpen(false)
    setMenu(false)
    navigate(n.link)
  }

  function linkClass({ isActive }){
    return 'px-3 py-2 rounded hover:bg-green-800 ' + (isActive ? 'bg-green-800' : '')
  }

  const items = []
  for (let i = 0; i < list.length && i < 8; i++){
    const n = list[i]
    items.push(
      <li key={n.id} className={'px-4 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ' + (n.read ? 'text-gray-500' : 'font-medium')} onClick={() => openNotification(n)}>
        <p className="text-sm">{n.text}</p>
        <p className="text-xs text-gray-400">{ShortDate(n.createdAt)}</p>
      </li>
    )
  }

  const badge = 'ml-1 bg-yellow-400 text-green-900 text-xs font-bold px-1.5 rounded-full'

  let links = null
  if (user && user.role === 'customer'){
    links = (
      <>
        <NavLink to="/orders" className={linkClass}>My Orders</NavLink>
        <NavLink to="/following" className={linkClass}>Following</NavLink>
        <NavLink to="/cart" className={linkClass}>Cart{count > 0 && <span className={badge}>{count}</span>}</NavLink>
      </>
    )
  } else if (user && user.role === 'farmer'){
    links = <NavLink to="/farmer" className={linkClass}>Dashboard</NavLink>
  } else if (user && user.role === 'rider'){
    links = <NavLink to="/rider" className={linkClass}>Deliveries</NavLink>
  } else if (user && user.role === 'admin'){
    links = <NavLink to="/admin" className={linkClass}>Admin</NavLink>
  }

  return (
  <header className="bg-green-700 text-white">
    <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
      <Link to="/" className="text-xl font-bold">🌾 FarmDirect</Link>
      <button className="md:hidden text-2xl cursor-pointer" onClick={() => setMenu(!menu)}>&#9776;</button>
      <nav className={(menu ? 'flex' : 'hidden') + ' md:flex flex-col md:flex-row md:items-center gap-1 absolute md:static left-0 right-0 top-14 bg-green-700 px-4 pb-4 md:p-0 z-20'} onClick={navClick}>
        <NavLink to="/" className={linkClass}>Products</NavLink>
        {links}
        {user ? (
          <>
            <div className="relative">
              <button className="px-3 py-2 rounded hover:bg-green-800 cursor-pointer" onClick={toggleBell}>&#128276;{unread > 0 && <span className={badge}>{unread}</span>}</button>
              {open && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white text-gray-800 rounded shadow-lg z-30">
                  <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 text-sm font-semibold">
                    <span>Notifications</span>
                    {unread > 0 && <button className="link text-xs font-normal cursor-pointer" onClick={() => dispatch(markAllRead())}>Mark all read</button>}
                  </div>
                  {items.length === 0 && <p className="muted px-4 py-3">Nothing yet</p>}
                  <ul className="max-h-80 overflow-y-auto">{items}</ul>
                </div>
              )}
            </div>
            <span className="px-3 py-2 text-sm text-green-100">Hi, {user.name} ({user.role})</span>
            <button onClick={Logout} className="px-3 py-2 rounded hover:bg-green-800 text-left cursor-pointer">Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={linkClass}>Login</NavLink>
            <NavLink to="/register" className={linkClass}>Register</NavLink>
          </>
        )}
      </nav>
    </div>
  </header>
);
}

export default Navbar;
