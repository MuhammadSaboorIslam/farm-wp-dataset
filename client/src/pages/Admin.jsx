import {useEffect,useState} from 'react'
import {useDispatch,useSelector} from 'react-redux'
import {Link} from 'react-router-dom'
import {loadPendingFarmers,verifyFarmer,loadUsers,loadAllOrders} from '../redux/admin'
import {flash} from '../redux/ui'
import {money,ShortDate} from '../helpers'
import {StatusPill,Loader,ErrorMsg} from '../components/Bits'

function Admin(){
  const dispatch = useDispatch()
  const { pending, users, orders, loading, error } = useSelector(state => state.admin)
  const [tab, setTab] = useState('pending')

  useEffect(()=>{
    dispatch(loadPendingFarmers())
    dispatch(loadUsers())
    dispatch(loadAllOrders())
  }, [dispatch])

  async function Decide(f, approve){
    if (!approve && !window.confirm('Reject ' + f.farmName + '?')){
      return
    }
    const result = await dispatch(verifyFarmer({ id: f.id, approve: approve }))
    if (!result.error){
      flash(dispatch, 'ok', f.farmName + (approve ? ' verified' : ' rejected'))
    }
  }

  const pendingRows = []
  for (let i = 0; i < pending.length; i++){
    const f = pending[i]
    pendingRows.push(
      <li key={f.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">{f.farmName}</h3>
          <p className="text-sm">{f.name} &middot; {f.email} &middot; {f.location}</p>
          <p className="muted">{f.bio}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm" onClick={() => Decide(f, true)}>Verify</button>
          <button className="btn-danger btn-sm" onClick={() => Decide(f, false)}>Reject</button>
        </div>
      </li>
    )
  }

  const userRows = []
  for (let i = 0; i < users.length; i++){
    const u = users[i]
    let status = ''
    if (u.role === 'farmer'){
      status = u.verified ? 'verified' : (u.rejected ? 'rejected' : 'pending')
    }
    userRows.push(
      <tr key={u.id} className="border-t border-gray-100">
        <td className="p-2">{u.name}</td>
        <td className="p-2">{u.email}</td>
        <td className="p-2 capitalize">{u.role}</td>
        <td className="p-2">{u.role === 'farmer' ? <Link to={'/farms/' + u.id} className="link">{u.farmName}</Link> : ''}</td>
        <td className="p-2">{status}</td>
      </tr>
    )
  }

  const orderRows = []
  for (let i = 0; i < orders.length; i++){
    const o = orders[i]
    orderRows.push(
      <tr key={o.id} className="border-t border-gray-100">
        <td className="p-2"><Link to={'/orders/' + o.id} className="link">{o.id}</Link></td>
        <td className="p-2">{o.customer.name}</td>
        <td className="p-2">{o.farmer.farmName}</td>
        <td className="p-2">{o.rider ? o.rider.name : '-'}</td>
        <td className="p-2">{money(o.total)}</td>
        <td className="p-2"><StatusPill status={o.status} /></td>
        <td className="p-2 whitespace-nowrap">{ShortDate(o.createdAt)}</td>
      </tr>
    )
  }

  const th = 'p-2 font-semibold'

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Admin</h2>
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
        <button className={'tab whitespace-nowrap ' + (tab === 'pending' ? 'tab-active' : '')} onClick={() => setTab('pending')}>Pending farmers {pending.length > 0 && <span className="ml-1 bg-yellow-400 text-green-900 text-xs font-bold px-1.5 rounded-full">{pending.length}</span>}</button>
        <button className={'tab whitespace-nowrap ' + (tab === 'users' ? 'tab-active' : '')} onClick={() => setTab('users')}>Users ({users.length})</button>
        <button className={'tab whitespace-nowrap ' + (tab === 'orders' ? 'tab-active' : '')} onClick={() => setTab('orders')}>Orders ({orders.length})</button>
      </div>
      {loading && <Loader />}
      {error && <ErrorMsg message={error} />}

      {tab === 'pending' && !loading && (
        <div>
          {pendingRows.length == 0 && <p className="empty">No farms waiting for verification.</p>}
          <ul className="flex flex-col gap-3">{pendingRows}</ul>
        </div>
      )}

      {tab === 'users' && !loading && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600"><tr><th className={th}>Name</th><th className={th}>Email</th><th className={th}>Role</th><th className={th}>Farm</th><th className={th}>Status</th></tr></thead>
            <tbody>{userRows}</tbody>
          </table>
        </div>
      )}

      {tab === 'orders' && !loading && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600"><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Farm</th><th className={th}>Rider</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}>Date</th></tr></thead>
            <tbody>{orderRows}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Admin
