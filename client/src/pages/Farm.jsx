import {useEffect} from 'react'
import {useParams} from 'react-router-dom'
import {useDispatch,useSelector} from 'react-redux'
import {loadFarm,toggleFollow} from '../redux/farms'
import {flash} from '../redux/ui'
import {ShortDate} from '../helpers'
import ProductCard from '../components/ProductCard'
import {Loader,ErrorMsg,Img,Stars} from '../components/Bits'

function Farm(){
  const { id } = useParams()
  const dispatch = useDispatch()
  const { current, loading, error } = useSelector(state => state.farms)
  const user = useSelector(state => state.auth.user)

  useEffect(()=>{
    dispatch(loadFarm(id))
  }, [dispatch, id])

  if (loading) return <Loader />
  if (error) return <ErrorMsg message={error} />
  if (!current) return null

  const farm = current.farm

  async function FollowFarm(){
    const result = await dispatch(toggleFollow({ id: farm.id, following: current.following }))
    if (!result.error){
      flash(dispatch, 'ok', current.following ? 'Unfollowed ' + farm.farmName : 'You now follow ' + farm.farmName)
    }
  }

  const cards = []
  for (let i = 0; i < current.products.length; i++){
    cards.push(<ProductCard key={current.products[i].id} product={current.products[i]} />)
  }

  const feed = []
  for (let i = 0; i < current.updates.length; i++){
    const u = current.updates[i]
    feed.push(
      <li key={u.id} className="card p-4">
        <h3 className="font-semibold">{u.title}</h3>
        <p className="muted">{ShortDate(u.createdAt)}</p>
        <p className="mt-1">{u.body}</p>
        {u.images.length > 0 && <Img src={u.images[0]} alt={u.title} className="w-full h-48 rounded mt-3" />}
      </li>
    )
  }

  return (
    <div>
      <div className="card p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{farm.farmName}</h1>
          <p className="muted">{farm.name} &middot; {farm.location}</p>
          <Stars rating={current.rating} count={current.reviewCount} />
          <p className="mt-2">{farm.bio}</p>
          <p className="muted mt-2">{current.followers} followers &middot; {current.products.length} products</p>
        </div>
        {user && user.role === 'customer' && (
          <button className={current.following ? 'btn-ghost' : 'btn'} onClick={FollowFarm}>
            {current.following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      <h2 className="text-xl font-bold mb-3">Products</h2>
      {cards.length == 0 && <p className="empty">Nothing listed right now.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{cards}</div>

      <h2 className="text-xl font-bold mb-3">Updates from the farm</h2>
      {feed.length == 0 && <p className="empty">No updates posted yet.</p>}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">{feed}</ul>
    </div>
  )
}

export default Farm
