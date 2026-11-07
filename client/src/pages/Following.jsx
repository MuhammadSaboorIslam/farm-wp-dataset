import {useEffect} from 'react'
import {useDispatch,useSelector} from 'react-redux'
import {Link} from 'react-router-dom'
import {loadFollowing} from '../redux/farms'
import {ShortDate} from '../helpers'
import {Loader,ErrorMsg} from '../components/Bits'

function Following(){
  const dispatch = useDispatch()
  const { following, loading, error } = useSelector(state => state.farms)

  useEffect(() => {
    dispatch(loadFollowing())
  }, [dispatch])

  const rows = []
  for (let i = 0; i < following.length; i++){
    const f = following[i]
    rows.push(
      <li key={f.farm.id} className="card p-4 flex flex-col md:flex-row gap-4 justify-between">
        <div>
          <Link to={'/farms/' + f.farm.id} className="link"><h3 className="font-semibold text-lg">{f.farm.farmName}</h3></Link>
          <p className="muted">{f.farm.location} &middot; {f.productCount} products</p>
        </div>
        <div className="md:w-1/2 bg-gray-50 rounded p-3 text-sm">
          {f.latestUpdate ? (
            <>
              <p><b>{f.latestUpdate.title}</b></p>
              <p>{f.latestUpdate.body}</p>
              <p className="muted">{ShortDate(f.latestUpdate.createdAt)}</p>
            </>
          ) : <p className="muted">No updates yet</p>}
        </div>
      </li>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Farms you follow</h2>
      {loading && <Loader />}
      {error && <ErrorMsg message={error} />}
      {!loading && following.length == 0 && <p className="empty">You are not following any farms. Open a farm page and press Follow.</p>}
      {!loading && <ul className="flex flex-col gap-3">{rows}</ul>}
    </div>
  )
}

export default Following
