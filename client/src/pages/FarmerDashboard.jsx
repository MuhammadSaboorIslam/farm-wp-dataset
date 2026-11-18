import {useEffect,useState} from 'react'
import {useDispatch,useSelector} from 'react-redux'
import {Link} from 'react-router-dom'
import {loadMyProducts,deleteProduct,updateProduct} from '../redux/products'
import {loadMyOrders,setOrderStatus} from '../redux/orders'
import {loadMyUpdates,postUpdate,clearSaveError} from '../redux/farms'
import {flash} from '../redux/ui'
import {money,ShortDate,readFiles} from '../helpers'
import {StatusPill,Img,Loader,ErrorMsg} from '../components/Bits'

function FarmerDashboard(){
  const dispatch = useDispatch()
  const user = useSelector(state => state.auth.user)
  const { mine, mineLoading } = useSelector(state => state.products)
  const orders = useSelector(state => state.orders)
  const farms = useSelector(state => state.farms)
  const [tab, setTab] = useState('products')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState([])
  const [formerror, setFormerror] = useState('')

  useEffect(()=>{
    dispatch(loadMyProducts())
    dispatch(loadMyOrders())
    dispatch(loadMyUpdates())
  }, [dispatch])

  async function removeproduct(p){
    if (window.confirm('Delete "' + p.name + '"?')){
      await dispatch(deleteProduct(p.id))
      flash(dispatch, 'ok', p.name + ' deleted')
    }
  }

  function ToggleActive(p){
    dispatch(updateProduct({ id: p.id, form: { active: !p.active } }))
  }

  async function pack(o){
    const result = await dispatch(setOrderStatus({ id: o.id, status: 'packed' }))
    if (result.error){
      flash(dispatch, 'warn', result.error.message)
    } else {
      flash(dispatch, 'ok', 'Order ' + o.id + ' marked as packed')
    }
  }

  async function pickimages(e){
    const urls = await readFiles(e.target.files)
    setImages(images.concat(urls))
  }

  function removeimage(index){
    const left = []
    for (let i = 0; i < images.length; i++){
      if (i != index) left.push(images[i])
    }
    setImages(left)
  }

  async function postupdate(e){
    e.preventDefault()
    if (!title.trim()){
      setFormerror('Give the update a title')
      return
    }
    setFormerror('')
    dispatch(clearSaveError())
    const result = await dispatch(postUpdate({ title: title.trim(), body: body.trim(), images: images }))
    if (!result.error){
      setTitle('')
      setBody('')
      setImages([])
      flash(dispatch, 'ok', 'Update posted to your followers')
    }
  }

  const productRows = []
  for (let i = 0; i < mine.length; i++){
    const p = mine[i]
    productRows.push(
      <tr key={p.id} className={'border-t border-gray-100 ' + (p.active ? '' : 'opacity-50')}>
        <td className="p-2"><Img src={p.images[0]} className="w-12 h-12 rounded" /></td>
        <td className="p-2"><Link to={'/products/' + p.id} className="font-semibold hover:underline">{p.name}</Link><br /><span className="muted">{p.category}</span></td>
        <td className="p-2 whitespace-nowrap">{money(p.price)} / {p.unit}</td>
        <td className="p-2">{p.quantity}</td>
        <td className="p-2">{p.active ? 'Listed' : 'Hidden'}</td>
        <td className="p-2 whitespace-nowrap text-right">
          <Link to={'/farmer/products/' + p.id + '/edit'} className="btn-ghost btn-sm mr-1">Edit</Link>
          <button className="btn-ghost btn-sm mr-1" onClick={() => ToggleActive(p)}>{p.active ? 'Hide' : 'Show'}</button>
          <button className="btn-danger btn-sm" onClick={() => removeproduct(p)}>Delete</button>
        </td>
      </tr>
    )
  }

  const orderRows = []
  for (let i = 0; i < orders.list.length; i++){
    const o = orders.list[i]
    const names = []
    for (let j = 0; j < o.items.length; j++){
      names.push(o.items[j].qty + ' ' + o.items[j].unit + ' ' + o.items[j].name)
    }
    orderRows.push(
      <li key={o.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link to={'/orders/' + o.id} className="font-semibold text-lg hover:underline">{o.customer.name}</Link>
          <p className="text-sm">{names.join(', ')}</p>
          <p className="muted">{ShortDate(o.createdAt)} &middot; {money(o.total)} &middot; {o.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={o.status} />
          {o.status === 'placed' && <button className="btn btn-sm" onClick={() => pack(o)}>Mark packed</button>}
          <Link to={'/orders/' + o.id} className="btn-ghost btn-sm">Details</Link>
        </div>
      </li>
    )
  }

  const updateRows = []
  for (let i = 0; i < farms.myUpdates.length; i++){
    const u = farms.myUpdates[i]
    updateRows.push(
      <li key={u.id} className="card p-4">
        <h3 className="font-semibold">{u.title}</h3>
        <p className="muted">{ShortDate(u.createdAt)}</p>
        <p className="mt-1">{u.body}</p>
        {u.images.length > 0 && <Img src={u.images[0]} className="w-full h-40 rounded mt-3" />}
      </li>
    )
  }

  const previews = []
  for (let i = 0; i < images.length; i++){
    const n = i
    previews.push(<img key={n} src={images[n]} alt="" className="w-16 h-16 object-cover rounded cursor-pointer" onClick={() => removeimage(n)} />)
  }

  let pending = 0
  for (let i = 0; i < orders.list.length; i++){
    if (orders.list[i].status == 'placed') pending++
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold">{user.farmName || 'My farm'}</h2>
          <p className="muted">{user.location} &middot; <Link to={'/farms/' + user.id} className="link">see your public page</Link></p>
        </div>
        {user.verified && <Link to="/farmer/products/new" className="btn">+ Add product</Link>}
      </div>

      {!user.verified && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-4 mb-4 text-sm">
          <b>Your farm is waiting for verification.</b> An admin checks new farms before they can sell. You can look around, but adding products and posting updates is off until then.
          {user.rejected && <span> Your last request was rejected; contact support.</span>}
        </div>
      )}

      <div className="flex border-b border-gray-200 mb-4">
        <button className={'tab ' + (tab === 'products' ? 'tab-active' : '')} onClick={() => setTab('products')}>Products ({mine.length})</button>
        <button className={'tab ' + (tab === 'orders' ? 'tab-active' : '')} onClick={() => setTab('orders')}>Orders {pending > 0 && <span className="ml-1 bg-yellow-400 text-green-900 text-xs font-bold px-1.5 rounded-full">{pending}</span>}</button>
        <button className={'tab ' + (tab === 'updates' ? 'tab-active' : '')} onClick={() => setTab('updates')}>Updates ({farms.myUpdates.length})</button>
      </div>

      {tab === 'products' && (
        <div>
          {mineLoading && <Loader />}
          {!mineLoading && mine.length === 0 && <p className="empty">No products yet. {user.verified && <Link to="/farmer/products/new" className="link">Add your first one</Link>}</p>}
          {mine.length > 0 && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600"><tr><th className="p-2"></th><th className="p-2">Product</th><th className="p-2">Price</th><th className="p-2">Stock</th><th className="p-2">Status</th><th className="p-2"></th></tr></thead>
                <tbody>{productRows}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div>
          {orders.loading && <Loader />}
          {orders.error && <ErrorMsg message={orders.error} />}
          {!orders.loading && orderRows.length === 0 && <p className="empty">No orders yet.</p>}
          {!orders.loading && <ul className="flex flex-col gap-3">{orderRows}</ul>}
        </div>
      )}

      {tab === 'updates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form className="card p-4 h-fit" onSubmit={postupdate}>
            <h3 className="text-lg font-semibold mb-3">Post an update</h3>
            <label className="label">Title
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} disabled={!user.verified} placeholder="e.g. Strawberries this week" />
            </label>
            <label className="label">What is happening on the farm
              <textarea rows="4" className="input" value={body} onChange={e => setBody(e.target.value)} disabled={!user.verified} />
            </label>
            <label className="label">Photos
              <input type="file" accept="image/*" multiple className="input" onChange={pickimages} disabled={!user.verified} />
            </label>
            <div className="flex gap-2 flex-wrap mb-3">{previews}</div>
            {(formerror || farms.saveError) && <p className="err">{formerror || farms.saveError}</p>}
            <button type="submit" className="btn w-full" disabled={!user.verified || farms.saving}>Post</button>
          </form>
          <div className="md:col-span-2">
            {updateRows.length === 0 && <p className="empty">Nothing posted yet.</p>}
            <ul className="flex flex-col gap-3">{updateRows}</ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default FarmerDashboard
