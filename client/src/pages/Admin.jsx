import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { loadPendingFarmers, verifyFarmer, loadUsers, loadAllOrders, loadAdminStats, setBlocked, loadAdminProducts, setHidden } from '../redux/admin'
import { flash } from '../redux/ui'
import { money, ShortDate, orderno } from '../helpers'
import { StatusPill, Loader, ErrorMsg, Img } from '../components/Bits'
import AdminOverview from '../components/AdminOverview'

function Badge({ tone, children }) {
  const tones = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
  }
  return (
    <span
      className={'inline-block text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ' + tones[tone]}
    >
      {children}
    </span>
  )
}

function Admin() {
  const dispatch = useDispatch()
  const { pending, users, orders, products, stats, loading, error } = useSelector((state) => state.admin)
  const [tab, setTab] = useState('overview')
  const [userQ, setUserQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [productQ, setProductQ] = useState('')

  useEffect(()=>{
    dispatch(loadAdminStats())
    dispatch(loadPendingFarmers())
    dispatch(loadUsers())
    dispatch(loadAllOrders())
    dispatch(loadAdminProducts())
  }, [dispatch])

  async function toggleBlock(u) {
    const blocked = !u.blocked
    if (
      blocked &&
      !window.confirm(
        'Block ' +
          u.name +
          '? They will not be able to log in' +
          (u.role === 'farmer' ? ', and their farm and products disappear from the site.' : '.'),
      )
    ) {
      return
    }
    const result = await dispatch(setBlocked({ id: u.id, blocked: blocked }))
    if (result.error) {
      flash(dispatch, 'warn', result.error.message)
    } else {
      flash(dispatch, 'ok', u.name + (blocked ? ' blocked' : ' unblocked'))
      dispatch(loadAdminStats())
    }
  }

  async function toggleHidden(p) {
    const result = await dispatch(setHidden({ id: p.id, hidden: !p.hidden }))
    if (result.error) {
      flash(dispatch, 'warn', result.error.message)
    } else {
      flash(dispatch, 'ok', p.name + (p.hidden ? ' is visible again' : ' hidden from the shop'))
      dispatch(loadAdminStats())
    }
  }

  async function Decide(f, approve) {
    if (!approve && !window.confirm('Reject ' + f.farmName + '?')) {
      return
    }
    const result = await dispatch(verifyFarmer({ id: f.id, approve: approve }))
    if (!result.error) {
      flash(dispatch, 'ok', f.farmName + (approve ? ' verified' : ' rejected'))
    }
  }

  const pendingRows = []
  for (let i = 0; i < pending.length; i++) {
    const f = pending[i]
    pendingRows.push(
      <li key={f.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">{f.farmName}</h3>
          <p className="text-sm">
            {f.name} &middot; {f.email} &middot; {f.location}
            {f.phone && <> &middot; {f.phone}</>}
          </p>
          {(f.farmSize || f.crops) && (
            <p className="text-sm text-gray-600">
              {f.farmSize ? f.farmSize + ' acres' : ''}
              {f.farmSize && f.crops ? ' · ' : ''}
              {f.crops ? 'Grows ' + f.crops : ''}
            </p>
          )}
          <p className="muted">{f.bio}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm" onClick={() => Decide(f, true)}>
            Verify
          </button>
          <button className="btn-danger btn-sm" onClick={() => Decide(f, false)}>
            Reject
          </button>
        </div>
      </li>,
    )
  }

  const uq = userQ.trim().toLowerCase()
  const userRows = []
  for (let i = 0; i < users.length; i++) {
    const u = users[i]
    if (roleFilter && u.role !== roleFilter) continue
    if (uq && !(u.name + ' ' + u.email + ' ' + (u.farmName || '')).toLowerCase().includes(uq)) continue
    let badge = null
    if (u.blocked) badge = <Badge tone="red">Blocked</Badge>
    else if (u.role === 'farmer' && u.verified) badge = <Badge tone="green">Verified</Badge>
    else if (u.role === 'farmer' && u.rejected) badge = <Badge tone="gray">Rejected</Badge>
    else if (u.role === 'farmer') badge = <Badge tone="yellow">Waiting</Badge>
    else badge = <Badge tone="gray">Active</Badge>
    userRows.push(
      <tr key={u.id} className={'border-t border-gray-100 ' + (u.blocked ? 'bg-red-50/40' : '')}>
        <td className="p-2 font-medium">{u.name}</td>
        <td className="p-2 text-gray-600">{u.email}</td>
        <td className="p-2 capitalize">{u.role}</td>
        <td className="p-2">
          {u.role === 'farmer' ? (
            <Link to={'/farms/' + u.id} className="link">
              {u.farmName}
            </Link>
          ) : (
            ''
          )}
        </td>
        <td className="p-2">{badge}</td>
        <td className="p-2 whitespace-nowrap text-gray-500">{ShortDate(u.createdAt)}</td>
        <td className="p-2 text-right">
          {u.role !== 'admin' && (
            <button
              className={(u.blocked ? 'btn-ghost' : 'btn-danger') + ' btn-sm'}
              onClick={() => toggleBlock(u)}
            >
              {u.blocked ? 'Unblock' : 'Block'}
            </button>
          )}
        </td>
      </tr>,
    )
  }

  const pq = productQ.trim().toLowerCase()
  const productRows = []
  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    if (
      pq &&
      !(p.name + ' ' + p.category + ' ' + (p.farmer ? p.farmer.farmName : '')).toLowerCase().includes(pq)
    )
      continue
    let badge = <Badge tone="green">Live</Badge>
    if (p.hidden) badge = <Badge tone="red">Hidden by admin</Badge>
    else if (!p.active) badge = <Badge tone="gray">Paused by farmer</Badge>
    else if (p.quantity === 0) badge = <Badge tone="yellow">Sold out</Badge>
    productRows.push(
      <tr key={p.id} className={'border-t border-gray-100 ' + (p.hidden ? 'bg-red-50/40' : '')}>
        <td className="p-2">
          <Img src={p.images[0]} className="w-10 h-10 rounded" />
        </td>
        <td className="p-2 font-medium">
          <Link to={'/products/' + p.id} className="hover:underline">
            {p.name}
          </Link>
          <br />
          <span className="muted">{p.category}</span>
        </td>
        <td className="p-2">
          {p.farmer ? (
            <Link to={'/farms/' + p.farmer.id} className="link">
              {p.farmer.farmName}
            </Link>
          ) : (
            '-'
          )}
        </td>
        <td className="p-2 whitespace-nowrap">
          {money(p.price)} / {p.unit}
        </td>
        <td className="p-2">{p.quantity}</td>
        <td className="p-2">{badge}</td>
        <td className="p-2 text-right">
          <button
            className={(p.hidden ? 'btn-ghost' : 'btn-danger') + ' btn-sm'}
            onClick={() => toggleHidden(p)}
          >
            {p.hidden ? 'Unhide' : 'Hide'}
          </button>
        </td>
      </tr>,
    )
  }

  const orderRows = []
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i]
    orderRows.push(
      <tr key={o.id} className="border-t border-gray-100">
        <td className="p-2">
          <Link to={'/orders/' + o.id} className="link font-mono">
            {orderno(o.id)}
          </Link>
        </td>
        <td className="p-2">{o.customer.name}</td>
        <td className="p-2">{o.farmer.farmName}</td>
        <td className="p-2">{o.rider ? o.rider.name : '-'}</td>
        <td className="p-2">{money(o.total)}</td>
        <td className="p-2">
          <StatusPill status={o.status} />
        </td>
        <td className="p-2 whitespace-nowrap">{ShortDate(o.createdAt)}</td>
      </tr>,
    )
  }

  const th = 'p-2 font-semibold'

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Admin</h2>
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
        <button
          className={'tab whitespace-nowrap ' + (tab === 'overview' ? 'tab-active' : '')}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          className={'tab whitespace-nowrap ' + (tab === 'pending' ? 'tab-active' : '')}
          onClick={() => setTab('pending')}
        >
          Pending farmers{' '}
          {pending.length > 0 && (
            <span className="ml-1 bg-yellow-400 text-green-900 text-xs font-bold px-1.5 rounded-full">
              {pending.length}
            </span>
          )}
        </button>
        <button
          className={'tab whitespace-nowrap ' + (tab === 'users' ? 'tab-active' : '')}
          onClick={() => setTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          className={'tab whitespace-nowrap ' + (tab === 'products' ? 'tab-active' : '')}
          onClick={() => setTab('products')}
        >
          Products ({products.length})
        </button>
        <button
          className={'tab whitespace-nowrap ' + (tab === 'orders' ? 'tab-active' : '')}
          onClick={() => setTab('orders')}
        >
          Orders ({orders.length})
        </button>
      </div>
      {error && <ErrorMsg message={error} />}

      {tab === 'overview' &&
        (stats ? <AdminOverview stats={stats} onPending={() => setTab('pending')} /> : <Loader />)}
      {tab !== 'overview' && loading && <Loader />}

      {tab === 'pending' && !loading && (
        <div>
          {pendingRows.length == 0 && <p className="empty">No farms waiting for verification.</p>}
          <ul className="flex flex-col gap-3">{pendingRows}</ul>
        </div>
      )}

      {tab === 'users' && !loading && (
        <div>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              className="input mt-0 sm:max-w-xs"
              value={userQ}
              onChange={(e) => setUserQ(e.target.value)}
              placeholder="Search name, email or farm"
            />
            <select
              className="input mt-0 sm:max-w-44"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All roles</option>
              <option value="customer">Customers</option>
              <option value="farmer">Farmers</option>
              <option value="rider">Riders</option>
              <option value="admin">Admins</option>
            </select>
            <p className="muted sm:ml-auto self-center">{userRows.length} shown</p>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Email</th>
                  <th className={th}>Role</th>
                  <th className={th}>Farm</th>
                  <th className={th}>Status</th>
                  <th className={th}>Joined</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>{userRows}</tbody>
            </table>
            {userRows.length === 0 && <p className="empty">No users match.</p>}
          </div>
        </div>
      )}

      {tab === 'products' && !loading && (
        <div>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              className="input mt-0 sm:max-w-xs"
              value={productQ}
              onChange={(e) => setProductQ(e.target.value)}
              placeholder="Search product, category or farm"
            />
            <p className="muted sm:ml-auto self-center">
              Hidden products disappear from the shop until you unhide them. The farmer gets a notification.
            </p>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className={th}></th>
                  <th className={th}>Product</th>
                  <th className={th}>Farm</th>
                  <th className={th}>Price</th>
                  <th className={th}>Stock</th>
                  <th className={th}>Status</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>{productRows}</tbody>
            </table>
            {productRows.length === 0 && <p className="empty">No products match.</p>}
          </div>
        </div>
      )}

      {tab === 'orders' && !loading && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className={th}>Order</th>
                <th className={th}>Customer</th>
                <th className={th}>Farm</th>
                <th className={th}>Rider</th>
                <th className={th}>Total</th>
                <th className={th}>Status</th>
                <th className={th}>Date</th>
              </tr>
            </thead>
            <tbody>{orderRows}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Admin
