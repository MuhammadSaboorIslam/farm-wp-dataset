import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { setQty, removeFromCart, clearCart } from '../redux/cart'
import { placeOrder, clearPlaced } from '../redux/orders'
import { flash } from '../redux/ui'
import { money, orderno } from '../helpers'
import { Img, Icon } from '../components/Bits'

function Cart() {
  const dispatch = useDispatch()
  const items = useSelector((state) => state.cart.items)
  const { placing, placeError, placed } = useSelector((state) => state.orders)
  const user = useSelector((state) => state.auth.user)

  let startAddress = localStorage.getItem('address')
  if (!startAddress && user && user.address) {
    startAddress = user.address
    if (user.city) {
      startAddress = startAddress + ', ' + user.city
    }
  }
  let startPhone = localStorage.getItem('phone')
  if (!startPhone && user && user.phone) {
    startPhone = user.phone
  }
  const [address, setAddress] = useState(startAddress || '')
  const [phone, setPhone] = useState(startPhone || '')
  const [formerror, setFormerror] = useState('')

  useEffect(()=>{
    return () => {
      dispatch(clearPlaced())
    }
  }, [dispatch])

  const groups = {}
  const order = []
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (!groups[it.farmerId]) {
      groups[it.farmerId] = { name: it.farmName, items: [], total: 0 }
      order.push(it.farmerId)
    }
    groups[it.farmerId].items.push(it)
    groups[it.farmerId].total += it.price * it.qty
  }
  let grand = 0
  for (let i = 0; i < order.length; i++) {
    grand += groups[order[i]].total
  }

  function lessone(it) {
    let qty = it.qty - 1
    if (qty < 1) {
      qty = 1
    }
    dispatch(setQty({ product: it.product, qty: qty }))
  }

  function addone(it) {
    let qty = it.qty + 1
    if (qty > it.max) {
      qty = it.max
    }
    dispatch(setQty({ product: it.product, qty: qty }))
  }

  function typedqty(it, value) {
    dispatch(setQty({ product: it.product, qty: Number(value) }))
  }

  async function PlaceOrder(e) {
    e.preventDefault()
    if (!address.trim() || !phone.trim()) {
      setFormerror('Address and phone are needed for delivery')
      return
    }
    if (!/^\d{10,13}$/.test(phone.trim())) {
      setFormerror('Phone should be 10 to 13 digits')
      return
    }
    setFormerror('')
    localStorage.setItem('address', address.trim())
    localStorage.setItem('phone', phone.trim())
    const body = { items: [], address: address.trim(), phone: phone.trim() }
    for (let i = 0; i < items.length; i++) {
      body.items.push({ product: items[i].product, qty: items[i].qty })
    }
    const result = await dispatch(placeOrder(body))
    if (!result.error) {
      dispatch(clearCart())
      flash(dispatch, 'ok', 'Order placed')
    }
  }

  if (placed) {
    const links = []
    for (let i = 0; i < placed.length; i++) {
      links.push(
        <li key={placed[i].id}>
          <Link to={'/orders/' + placed[i].id} className="link">
            Order {orderno(placed[i].id)}
          </Link>{' '}
          from {placed[i].farmer.farmName}, {money(placed[i].total)}
        </li>,
      )
    }
    return (
      <div className="card max-w-lg mx-auto p-6 mt-6 text-center">
        <Icon name="check" className="w-16 h-16" />
        <h2 className="text-2xl font-bold mt-2">Thank you</h2>
        <p className="mt-2">
          Your order went to {placed.length === 1 ? 'the farm' : placed.length + ' farms'}. They will pack it
          and a rider will bring it over.
        </p>
        <ul className="my-4 text-sm">{links}</ul>
        <p className="text-sm">
          <Link to="/orders" className="link">
            See all my orders
          </Link>{' '}
          or{' '}
          <Link to="/" className="link">
            keep shopping
          </Link>
        </p>
      </div>
    )
  }

  if (items.length == 0) {
    return (
      <div className="empty">
        <Icon name="cart-grey" className="w-20 h-20 mb-3" />
        <p className="text-lg">Your cart is empty.</p>
        <Link to="/" className="btn mt-4">
          Browse products
        </Link>
      </div>
    )
  }

  let count = 0
  for (let i = 0; i < items.length; i++) {
    count += items[i].qty
  }

  const blocks = []
  for (let g = 0; g < order.length; g++) {
    const group = groups[order[g]]
    const rows = []
    for (let i = 0; i < group.items.length; i++) {
      const it = group.items[i]
      rows.push(
        <li
          key={it.product}
          className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-t border-gray-100"
        >
          <Link to={'/products/' + it.product} className="shrink-0">
            <Img src={it.image} className="w-20 h-20 rounded-lg" />
          </Link>
          <div className="flex-1">
            <Link to={'/products/' + it.product} className="font-semibold hover:underline">
              {it.name}
            </Link>
            <p className="muted">
              {money(it.price)} / {it.unit} &middot; {it.max} available
            </p>
            <button
              className="text-red-600 text-sm hover:underline cursor-pointer mt-1"
              onClick={() => dispatch(removeFromCart(it.product))}
            >
              Remove
            </button>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => lessone(it)}>
                <Icon name="minus" className="w-3 h-3" />
              </button>
              <input
                type="number"
                min="1"
                max={it.max}
                className="w-12 text-center py-1 focus:outline-none"
                value={it.qty}
                onChange={(e) => typedqty(it, e.target.value)}
              />
              <button className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => addone(it)}>
                <Icon name="plus-dark" className="w-3 h-3" />
              </button>
            </div>
            <span className="font-semibold w-24 text-right">{money(it.price * it.qty)}</span>
          </div>
        </li>,
      )
    }
    blocks.push(
      <div key={order[g]} className="card p-4 mb-4">
        <h3 className="font-semibold">
          <Link to={'/farms/' + order[g]} className="link">
            {group.name}
          </Link>{' '}
          <span className="muted">subtotal {money(group.total)}</span>
        </h3>
        <ul>{rows}</ul>
      </div>,
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your cart</h2>
      {order.length > 1 && (
        <p className="muted mb-3">
          Items from {order.length} farms become {order.length} separate orders, one per farm.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">{blocks}</div>
        <form className="card p-5 h-fit md:sticky md:top-4 shadow-sm" onSubmit={PlaceOrder}>
          <h3 className="text-lg font-semibold mb-3">Order summary</h3>
          <div className="text-sm flex flex-col gap-1 border-b border-gray-200 pb-3 mb-3">
            <p className="flex justify-between">
              <span className="text-gray-500">Items ({count})</span>
              <span>{money(grand)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Delivery</span>
              <span className="text-green-700">Free</span>
            </p>
            <p className="flex justify-between font-bold text-lg mt-1">
              <span>Total</span>
              <span>{money(grand)}</span>
            </p>
          </div>
          <label className="label">
            Delivery address
            <textarea
              rows="3"
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, street, area, city"
            />
          </label>
          <label className="label">
            Phone
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03001234567"
            />
          </label>
          {(formerror || placeError) && <p className="err">{formerror || placeError}</p>}
          <button type="submit" className="btn w-full py-3" disabled={placing}>
            {placing ? 'Placing...' : 'Place order'}
          </button>
          <p className="muted mt-2 text-center">Cash on delivery</p>
        </form>
      </div>
    </div>
  )
}

export default Cart
