import {useState,useEffect} from "react";
import {Link,NavLink,useNavigate,useLocation} from "react-router-dom";
import {useSelector,useDispatch} from "react-redux";
import {logoutUser} from "../redux/auth";
import {cartCount} from "../redux/cart";
import {loadNotifications,markAllRead,clearNotifications} from "../redux/notifications";
import {ShortDate} from "../helpers";
import {Icon} from "./Bits";

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

  function navclick(e){
    if (e.target.closest('a')){
      setMenu(false)
      setOpen(false)
    }
  }

  function Logout() {
    dispatch(logoutUser());
    navigate("/");
  }

  function ToggleBell(){
     if (!open){
      dispatch(loadNotifications())
    }
    setOpen(!open)
  }

  function opennotification(n){
    setOpen(false)
    setMenu(false)
    navigate(n.link)
  }

  function linkclass({ isActive }){
    return 'navlink ' + (isActive ? 'active' : '')
  }

  const items = []
  for (let i = 0; i < list.length && i < 8; i++){
    const n = list[i]
    items.push(
      <li key={n.id} className={'px-4 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ' + (n.read ? 'text-gray-500' : 'font-medium')} onClick={() => opennotification(n)}>
        <p className="text-sm">{n.text}</p>
        <p className="text-xs text-gray-400">{ShortDate(n.createdAt)}</p>
      </li>
    )
  }


  let links = null
  if (user && user.role === 'customer'){
    links = (
      <>
        <NavLink to="/orders" className={linkclass}>My Orders</NavLink>
        <NavLink to="/following" className={linkclass}>Following</NavLink>
      </>
    )
  } else if (user && user.role === 'farmer'){
    links = <NavLink to="/farmer" className={linkclass}>Dashboard</NavLink>
  } else if (user && user.role === 'rider'){
    links = <NavLink to="/rider" className={linkclass}>Deliveries</NavLink>
  } else if (user && user.role === 'admin'){
    links = <NavLink to="/admin" className={linkclass}>Admin</NavLink>
  }

  let right
  if (user){
    right = (
      <>
        {user.role === 'customer' && (
          <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100" title="Cart"><Icon name="cart" className="w-6 h-6" />{count > 0 && <span className="badge">{count}</span>}</Link>
        )}
        <div className="relative">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={ToggleBell} title="Notifications"><Icon name="bell" className="w-6 h-6" />{unread > 0 && <span className="badge">{unread}</span>}</button>
          {open && (
            <div className="dropdown">
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 text-sm font-semibold">
                <span>Notifications</span>
                {unread > 0 && <button className="link text-xs font-normal cursor-pointer" onClick={() => dispatch(markAllRead())}>Mark all read</button>}
              </div>
              {items.length === 0 && <p className="muted px-4 py-4">Nothing yet</p>}
              <ul className="max-h-80 overflow-y-auto">{items}</ul>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pl-2 md:border-l md:border-gray-200">
          <span className="avatar">{user.name[0].toUpperCase()}</span>
          <span className="text-sm leading-tight">
            <span className="block font-medium">{user.name}</span>
            <span className="block text-xs text-gray-500">({user.role})</span>
          </span>
          <button onClick={Logout} className="btn-ghost btn-sm ml-2 inline-flex items-center gap-1"><Icon name="logout" className="w-3.5 h-3.5" />Logout</button>
        </div>
      </>
    )
  } else {
    right = (
      <>
        <NavLink to="/login" className={linkclass}>Login</NavLink>
        <Link to="/register" className="btn btn-sm">Register</Link>
      </>
    )
  }

  return (
  <header className="bar">
    <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
      <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-green-800">
        <span className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center"><Icon name="wheat" className="w-6 h-6" /></span>
        FarmDirect
      </Link>

    <nav className="hidden md:flex items-center gap-1" onClick={navclick}>
        <NavLink to="/" className={linkclass}>Products</NavLink>
        {links}
      </nav>

      <div className="hidden md:flex items-center gap-1" onClick={navclick}>{right}</div>

      <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => setMenu(!menu)} title="Menu"><Icon name="menu" className="w-6 h-6" /></button>
    </div>

    {menu && (
      <nav className="md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-1" onClick={navclick}>
        <NavLink to="/" className={linkclass}>Products</NavLink>
        {links}
        {user && user.role === 'customer' && <NavLink to="/cart" className={linkclass}>Cart {count > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">{count}</span>}</NavLink>}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-100 mt-1 flex-wrap">{right}</div>
      </nav>
    )}
  </header>
);
}

export default Navbar;
