import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { loadAvailable, loadMyOrders, claimOrder, setOrderStatus } from '../redux/orders'
import { flash } from '../redux/ui'
import { money, ShortDate, orderno } from '../helpers'
import { StatusPill, Loader, ErrorMsg } from '../components/Bits'
import RiderOverview from '../components/RiderOverview'

function Rider() {
  const dispatch = useDispatch()
  const { available, list, loading, error } = useSelector((state) => state.orders)
  const [tab, setTab] = useState('earnings')

  useEffect(()=>{
    dispatch(loadAvailable())
    dispatch(loadMyOrders())
  }, [dispatch])

  async function ClaimOrder(o) {
    const result = await dispatch(claimOrder(o.id))
    if (result.error) {
      flash(dispatch, 'warn', result.error.message)
    } else {
      flash(dispatch, 'ok', 'Order ' + orderno(o.id) + ' is yours. Pick it up from ' + o.farmer.farmName)
      setTab('mine')
    }
  }

  async function changestatus(o, status) {
    const result = await dispatch(setOrderStatus({ id: o.id, status: status }))
    if (result.error) {
      flash(dispatch, 'warn', result.error.message)
    } else {
      flash(dispatch, 'ok', status === 'delivered' ? 'Delivered, nice work' : 'On the way')
    }
  }

  function row(o, actions) {
    return (
      <li key={o.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">
            {o.farmer.farmName} <span className="muted">&rarr; {o.customer.name}</span>
          </h3>
          <p className="text-sm">
            Pick up: {o.farmer.location}. Deliver to: {o.address}
          </p>
          <p className="muted">
            {orderno(o.id)} &middot; {o.items.length} item{o.items.length > 1 ? 's' : ''} &middot;{' '}
            {money(o.total)} cash on delivery &middot; {ShortDate(o.createdAt)}
          </p>
          {o.deliveryFee && (
            <p className="text-sm font-medium text-green-700 mt-1">
              {o.status === 'delivered' ? 'You earned ' : 'You earn about '}
              {money(o.deliveryFee)} &middot; {o.distanceKm} km
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={o.status} />
          {actions}
          <Link to={'/orders/' + o.id} className="btn-ghost btn-sm">
            Details
          </Link>
        </div>
      </li>
    )
  }

  const availableRows = []
  for (let i = 0; i < available.length; i++) {
    availableRows.push(
      row(
        available[i],
        <button className="btn btn-sm" onClick={() => ClaimOrder(available[i])}>
          Claim
        </button>,
      ),
    )
  }

  const activeRows = []
  const doneRows = []
  for (let i = 0; i < list.length; i++) {
    const o = list[i]
    let action = null
    if (o.status === 'packed')
      action = (
        <button className="btn btn-sm" onClick={() => changestatus(o, 'out_for_delivery')}>
          Picked up
        </button>
      )
    if (o.status === 'out_for_delivery')
      action = (
        <button className="btn btn-sm" onClick={() => changestatus(o, 'delivered')}>
          Delivered
        </button>
      )
    if (o.status === 'delivered' || o.status === 'cancelled') {
      doneRows.push(row(o, null))
    } else {
      activeRows.push(row(o, action))
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Deliveries</h2>
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
        <button
          className={'tab whitespace-nowrap ' + (tab === 'earnings' ? 'tab-active' : '')}
          onClick={() => setTab('earnings')}
        >
          Earnings
        </button>
        <button
          className={'tab whitespace-nowrap ' + (tab === 'available' ? 'tab-active' : '')}
          onClick={() => setTab('available')}
        >
          Available ({available.length})
        </button>
        <button
          className={'tab whitespace-nowrap ' + (tab === 'mine' ? 'tab-active' : '')}
          onClick={() => setTab('mine')}
        >
          My deliveries ({activeRows.length})
        </button>
        <button
          className={'tab whitespace-nowrap ' + (tab === 'done' ? 'tab-active' : '')}
          onClick={() => setTab('done')}
        >
          Completed ({doneRows.length})
        </button>
      </div>
      {tab === 'earnings' && <RiderOverview onGoAvailable={() => setTab('available')} />}
      {tab !== 'earnings' && loading && <Loader />}
      {tab !== 'earnings' && error && <ErrorMsg message={error} />}
      {tab === 'available' && !loading && availableRows.length === 0 && (
        <p className="empty">No packed orders right now.</p>
      )}
      {tab === 'mine' && !loading && activeRows.length === 0 && (
        <p className="empty">Nothing in progress.</p>
      )}
      {tab === 'done' && !loading && doneRows.length === 0 && (
        <p className="empty">No completed deliveries yet.</p>
      )}
      {!loading && (
        <ul className="flex flex-col gap-3">
          {tab === 'available' && availableRows}
          {tab === 'mine' && activeRows}
          {tab === 'done' && doneRows}
        </ul>
      )}
    </div>
  )
}

export default Rider
