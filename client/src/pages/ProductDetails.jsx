import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadProduct, addReview } from '../redux/products'
import { addToCart } from '../redux/cart'
import { loadMyOrders } from '../redux/orders'
import { flash } from '../redux/ui'
import { money, ShortDate, orderno } from '../helpers'
import { Loader, ErrorMsg, Img, Stars, Icon } from '../components/Bits'
import WishButton from '../components/WishButton'

function ProductDetails() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { current: p, reviews, loading, error } = useSelector((state) => state.products)
  const user = useSelector((state) => state.auth.user)
  const orders = useSelector((state) => state.orders.list)
  const cartItems = useSelector((state) => state.cart.items)
  const [qty, setQty] = useState(1)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [orderId, setOrderId] = useState('')
  const [formerror, setFormerror] = useState('')

  useEffect(()=>{
    dispatch(loadProduct(id))
  }, [dispatch, id])

  useEffect(()=>{
    if (user && user.role === 'customer') {
      dispatch(loadMyOrders())
    }
  }, [dispatch, user])

  if (loading) {
    return <Loader />
  }
  if (error) {
    return <ErrorMsg message={error} />
  }
  if (!p) {
    return null
  }

  function AddtoCart() {
    if (!user) {
      navigate('/login')
      return
    }
    dispatch(addToCart({ product: p, qty: Number(qty) }))
    flash(dispatch, 'ok', qty + ' ' + p.unit + ' of ' + p.name + ' added to cart')
    setQty(1)
  }

  const reviewable = []
  let myReviews = 0
  for (let j = 0; j < reviews.length; j++) {
    if (user && reviews[j].customer && reviews[j].customer.id === user.id) myReviews++
  }
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i]
    if (o.status !== 'delivered') continue
    let has = false
    for (let j = 0; j < o.items.length; j++) {
      if (o.items[j].product === p.id) has = true
    }
    if (!has) continue
    let done = false
    for (let j = 0; j < reviews.length; j++) {
      if (reviews[j].order === o.id && reviews[j].customer && reviews[j].customer.id === user.id) done = true
    }
    if (!done) reviewable.push(o)
  }

  async function submitreview(e) {
    e.preventDefault()
    if (!rating) {
      setFormerror('Pick a star rating')
      return
    }
    setFormerror('')
    const result = await dispatch(
      addReview({
        product: p.id,
        order: orderId || reviewable[0].id,
        rating: rating,
        comment: comment.trim(),
      }),
    )
    if (result.error) {
      setFormerror(result.error.message)
    } else {
      setRating(0)
      setComment('')
      flash(dispatch, 'ok', 'Thanks for your review')
    }
  }

  let inCart = 0
  for (let i = 0; i < cartItems.length; i++) {
    if (cartItems[i].product === p.id) inCart = cartItems[i].qty
  }

  function step(d) {
    let n = Number(qty) + d
    if (n < 1) n = 1
    if (n > p.quantity) n = p.quantity
    setQty(n)
  }

  let sideBox
  if (user && user.role !== 'customer') {
    sideBox = <p className="muted">Only customers can order. You are logged in as a {user.role}.</p>
  } else if (p.quantity == 0) {
    sideBox = <p className="muted">Sold out for now. Follow the farm to hear when it is back.</p>
  } else {
    sideBox = (
      <>
        <p className="text-3xl text-green-700 font-bold">
          {money(p.price)} <span className="muted font-normal">/ {p.unit}</span>
        </p>
        <p className={'text-sm mt-1 ' + (p.quantity < 10 ? 'text-orange-600' : 'text-green-700')}>
          {p.quantity < 10
            ? 'Only ' + p.quantity + ' ' + p.unit + ' left'
            : p.quantity + ' ' + p.unit + ' in stock'}
        </p>
        <p className="label mt-4 mb-1">Quantity ({p.unit})</p>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
          <button
            type="button"
            className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
            onClick={() => step(-1)}
          >
            <Icon name="minus" className="w-3 h-3" />
          </button>
          <input
            type="number"
            min="1"
            max={p.quantity}
            className="w-16 text-center py-2 focus:outline-none"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <button
            type="button"
            className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
            onClick={() => step(1)}
          >
            <Icon name="plus-dark" className="w-3 h-3" />
          </button>
        </div>
        <div className="flex justify-between border-t border-gray-200 mt-4 pt-3 text-sm">
          <span className="text-gray-500">Total</span>
          <span className="font-bold text-lg">{money(p.price * Number(qty || 0))}</span>
        </div>
        <button
          className="btn w-full mt-3 py-3 inline-flex items-center justify-center gap-2"
          onClick={AddtoCart}
        >
          {user && <Icon name="cart-white" className="w-5 h-5" />}
          {user ? 'Add to cart' : 'Login to order'}
        </button>
        <WishButton
          product={p}
          withLabel
          className="w-full mt-2 py-2.5 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:border-red-300 hover:bg-red-50"
        />
        {inCart > 0 && (
          <p className="text-sm text-center mt-3">
            {inCart} {p.unit} in your cart &middot;{' '}
            <Link to="/cart" className="link">
              View cart
            </Link>
          </p>
        )}
        <p className="muted text-center mt-3">
          Cash on delivery &middot; packed by the farm, brought by a rider
        </p>
      </>
    )
  }

  const reviewItems = []
  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i]
    reviewItems.push(
      <li key={r.id} className="border-b border-gray-100 py-3">
        <Stars rating={r.rating} />
        <p>{r.comment}</p>
        <p className="muted">
          {r.customer ? r.customer.name : 'Customer'}, {ShortDate(r.createdAt)}
        </p>
      </li>,
    )
  }

  const orderOptions = []
  for (let i = 0; i < reviewable.length; i++) {
    orderOptions.push(
      <option key={reviewable[i].id} value={reviewable[i].id}>
        Order {orderno(reviewable[i].id)} ({ShortDate(reviewable[i].createdAt)})
      </option>,
    )
  }

  return (
    <div>
      <button
        className="link text-sm mb-4 cursor-pointer inline-flex items-center gap-1"
        onClick={() => navigate(-1)}
      >
        <Icon name="back" className="w-3 h-3" />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Img src={p.images[0]} alt={p.name} className="w-full h-64 md:h-96 rounded-2xl shadow" />
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{p.category}</span>
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Icon name="pin" className="w-3 h-3" />
              {p.location}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">{p.name}</h1>
          <Stars rating={p.rating} count={p.reviewCount} />

          {p.description && (
            <section className="mt-6">
              <h3 className="text-lg font-semibold mb-1">About</h3>
              <p>{p.description}</p>
            </section>
          )}

          <section className="mt-6">
            <h3 className="text-lg font-semibold mb-1">Reviews</h3>
            {reviewItems.length === 0 && <p className="muted">No reviews yet.</p>}
            <ul>{reviewItems}</ul>

            {reviewable.length === 0 && myReviews > 0 && (
              <p className="muted mt-2">
                You have reviewed this product. Order it again to leave another review.
              </p>
            )}
            {reviewable.length > 0 && (
              <form className="card p-4 mt-4" onSubmit={submitreview}>
                <h4 className="font-semibold mb-2">Leave a review</h4>
                <Stars rating={rating} onPick={setRating} />
                {reviewable.length > 1 && (
                  <label className="label mt-2">
                    Which order
                    <select className="input" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                      {orderOptions}
                    </select>
                  </label>
                )}
                <textarea
                  rows="3"
                  className="input mb-3"
                  placeholder="How was it?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                {formerror && <p className="err">{formerror}</p>}
                <button type="submit" className="btn">
                  Post review
                </button>
              </form>
            )}
          </section>
        </div>

        <div className="h-fit md:sticky md:top-4 flex flex-col gap-4">
          <aside className="card p-5 shadow-sm">{sideBox}</aside>
          <Link to={'/farms/' + p.farmer.id} className="card flex items-center gap-3 p-3 hover:shadow">
            <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Icon name="wheat-green" className="w-6 h-6" />
            </span>
            <div>
              <p className="font-semibold">{p.farmer.farmName}</p>
              <p className="muted">
                by {p.farmer.name} &middot; {p.location} &middot; view farm &rarr;
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
export default ProductDetails
