import {useEffect} from 'react'
import {useParams,Link,useNavigate} from 'react-router-dom'
import {useDispatch,useSelector} from 'react-redux'
import {loadOrder,setOrderStatus,STATUS_LABELS} from '../redux/orders'
import {flash} from '../redux/ui'
import {money,PrettyDate} from '../helpers'
import {StatusPill,Img,Loader,ErrorMsg} from '../components/Bits'

const STEPS = ['placed', 'packed', 'out_for_delivery', 'delivered']

function OrderDetails(){
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { current: o, loading, error } = useSelector(state => state.orders)
  const user = useSelector(state => state.auth.user)

  useEffect(() => {
    dispatch(loadOrder(id))
  }, [dispatch, id])

  if (loading) return <Loader />
  if (error) return <ErrorMsg message={error} />
  if (!o) return null

  async function change(status){
    if (status === 'cancelled' && !window.confirm('Cancel this order?')){
      return
    }
    const result = await dispatch(setOrderStatus({ id: o.id, status: status }))
    if (result.error){
      flash(dispatch, 'warn', result.error.message)
    } else {
      flash(dispatch, 'ok', 'Order is now ' + STATUS_LABELS[status].toLowerCase())
    }
  }

  const items = []
  for (let i = 0; i < o.items.length; i++){
    const it = o.items[i]
    items.push(
      <li key={it.product} className="flex items-center gap-3 py-3 border-t border-gray-100">
        <Link to={'/products/' + it.product}><Img src={it.image} className="w-16 h-16 rounded" /></Link>
        <div className="flex-1">
          <Link to={'/products/' + it.product} className="font-semibold hover:underline">{it.name}</Link>
          <p className="muted">{it.qty} {it.unit} &times; {money(it.price)}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{money(it.qty * it.price)}</p>
          {o.status === 'delivered' && user.role === 'customer' && <Link to={'/products/' + it.product} className="link text-sm">Review</Link>}
        </div>
      </li>
    )
  }

  const timeline = []
  if (o.status === 'cancelled'){
    for (let i = 0; i < o.history.length; i++){
      const h = o.history[i]
      timeline.push(<li key={i} className="done flex gap-3"><span className="w-3 h-3 mt-1.5 rounded-full bg-green-600 shrink-0"></span><div><b>{STATUS_LABELS[h.status]}</b><p className="muted">{PrettyDate(h.at)} by {h.by}</p></div></li>)
    }
  } else {
    const reached = STEPS.indexOf(o.status)
    for (let i = 0; i < STEPS.length; i++){
      let when = null
      for (let j = 0; j < o.history.length; j++){
        if (o.history[j].status === STEPS[i]) when = o.history[j]
      }
      const hit = i <= reached
      timeline.push(
        <li key={STEPS[i]} className={(hit ? 'done ' : 'text-gray-400 ') + 'flex gap-3'}>
          <span className={'w-3 h-3 mt-1.5 rounded-full shrink-0 ' + (hit ? 'bg-green-600' : 'bg-gray-300')}></span>
          <div>
            <b>{STATUS_LABELS[STEPS[i]]}</b>
            <p className="text-sm text-gray-500">{when ? PrettyDate(when.at) + ' by ' + when.by : 'pending'}</p>
          </div>
        </li>
      )
    }
  }

  let actions = null
  if (user.role === 'customer' && o.status === 'placed'){
    actions = <button className="btn-danger w-full" onClick={() => change('cancelled')}>Cancel order</button>
  }
  if (user.role === 'farmer' && o.status === 'placed'){
    actions = <button className="btn w-full" onClick={() => change('packed')}>Mark as packed</button>
  }
  if (user.role === 'rider' && o.rider && o.rider.id === user.id){
    if (o.status === 'packed') actions = <button className="btn w-full" onClick={() => change('out_for_delivery')}>Picked up, out for delivery</button>
    if (o.status === 'out_for_delivery') actions = <button className="btn w-full" onClick={() => change('delivered')}>Mark as delivered</button>
  }
  if (user.role === 'admin' && o.status !== 'delivered' && o.status !== 'cancelled'){
    const next = STEPS[STEPS.indexOf(o.status) + 1]
    actions = (
      <>
        <button className="btn w-full" onClick={() => change(next)}>Move to {STATUS_LABELS[next]}</button>
        {o.status === 'placed' && <button className="btn-danger w-full" onClick={() => change('cancelled')}>Cancel</button>}
      </>
    )
  }

  return (
    <div>
      <button className="link text-sm mb-4 cursor-pointer" onClick={() => navigate(-1)}>&larr; Back</button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 card p-4">
          <h1 className="text-2xl font-bold flex items-center gap-3">Order {o.id} <StatusPill status={o.status} /></h1>
          <p className="muted mb-3">From <Link to={'/farms/' + o.farmer.id} className="link">{o.farmer.farmName}</Link> &middot; placed {PrettyDate(o.createdAt)}</p>
          <ul>{items}</ul>
          <p className="text-lg font-bold border-t border-gray-200 pt-3 text-right">Total {money(o.total)}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm mt-4">
            <dt className="text-gray-500">Customer</dt><dd>{o.customer.name}</dd>
            <dt className="text-gray-500">Deliver to</dt><dd>{o.address}</dd>
            <dt className="text-gray-500">Phone</dt><dd>{o.phone}</dd>
            <dt className="text-gray-500">Rider</dt><dd>{o.rider ? o.rider.name : 'Not assigned yet'}</dd>
          </dl>
        </div>
        <aside className="card p-4 h-fit">
          <h3 className="text-lg font-semibold mb-3">Tracking</h3>
          <ol className="timeline flex flex-col gap-4">{timeline}</ol>
          <div className="flex flex-col gap-2 mt-5">{actions}</div>
        </aside>
      </div>
    </div>
  )
}

export default OrderDetails
