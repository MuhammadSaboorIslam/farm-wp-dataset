import {useEffect,useState} from 'react'
import {useDispatch,useSelector} from 'react-redux'
import {Link} from 'react-router-dom'
import {loadMyOrders} from '../redux/orders'
import {money,ShortDate} from '../helpers'
import {StatusPill,Loader,ErrorMsg} from '../components/Bits'

function MyOrders(){
  const dispatch = useDispatch()
  const { list, loading, error } = useSelector(state => state.orders)
  const [tab, setTab] = useState('active')

  useEffect(() => {
    dispatch(loadMyOrders())
  }, [dispatch])

  const active = []
  const done = []
  for (let i = 0; i < list.length; i++){
    if (list[i].status === 'delivered' || list[i].status === 'cancelled'){
      done.push(list[i])
    } else {
      active.push(list[i])
    }
  }
  const shown = tab === 'active' ? active : done

  const rows = []
  for (let i = 0; i < shown.length; i++){
    const o = shown[i]
    const names = []
    for (let j = 0; j < o.items.length; j++){
      names.push(o.items[j].qty + ' ' + o.items[j].unit + ' ' + o.items[j].name)
    }
    rows.push(
      <li key={o.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link to={'/orders/' + o.id} className="font-semibold text-lg hover:underline">{o.farmer.farmName}</Link>
          <p className="text-sm">{names.join(', ')}</p>
          <p className="muted">{ShortDate(o.createdAt)} &middot; {money(o.total)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={o.status} />
          <Link to={'/orders/' + o.id} className="btn-ghost btn-sm">Details</Link>
        </div>
      </li>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My orders</h2>
      <div className="flex border-b border-gray-200 mb-4">
        <button className={'tab ' + (tab === 'active' ? 'tab-active' : '')} onClick={() => setTab('active')}>Active ({active.length})</button>
        <button className={'tab ' + (tab === 'done' ? 'tab-active' : '')} onClick={() => setTab('done')}>Completed ({done.length})</button>
      </div>
      {loading && <Loader />}
      {error && <ErrorMsg message={error} />}
      {!loading && list.length === 0 && <p className="empty">You have not ordered anything yet. <Link to="/" className="link">Browse products</Link></p>}
      {!loading && list.length > 0 && shown.length === 0 && <p className="empty">Nothing here.</p>}
      {!loading && <ul className="flex flex-col gap-3">{rows}</ul>}
    </div>
  )
}

export default MyOrders
