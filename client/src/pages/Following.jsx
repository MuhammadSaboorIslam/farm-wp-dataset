import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { loadFollowing } from '../redux/farms'
import { get } from '../api'
import { ShortDate, money } from '../helpers'
import { Loader, ErrorMsg, Img } from '../components/Bits'
import WishButton from '../components/WishButton'
import FarmNewsToggle from '../components/FarmNewsToggle'

function FeedItem({ item }) {
  const farm = item.kind === 'update' ? item.update.farmer : item.product.farmer
  return (
    <li className="card p-4">
      <p className="text-sm text-gray-500 mb-2">
        <Link to={'/farms/' + farm.id} className="font-semibold text-gray-900 hover:underline">
          {farm.farmName}
        </Link>
        {item.kind === 'update' ? ' posted an update' : ' added a new product'} &middot; {ShortDate(item.at)}
      </p>
      {item.kind === 'update' ? (
        <div>
          <h3 className="font-semibold text-lg">{item.update.title}</h3>
          {item.update.body && <p className="text-gray-700 mt-1 whitespace-pre-line">{item.update.body}</p>}
          {item.update.images.length > 0 && (
            <Img
              src={item.update.images[0]}
              alt={item.update.title}
              className="w-full h-52 rounded-lg mt-3"
            />
          )}
        </div>
      ) : (
        <Link
          to={'/products/' + item.product.id}
          className="flex gap-4 items-center rounded-lg border border-gray-100 p-2 hover:bg-gray-50"
        >
          <Img
            src={item.product.images[0]}
            alt={item.product.name}
            className="w-20 h-20 rounded-lg shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{item.product.name}</p>
            <p className="text-green-700 font-bold">
              {money(item.product.price)}{' '}
              <span className="text-gray-500 font-normal text-sm">/ {item.product.unit}</span>
            </p>
            {item.product.description && <p className="muted truncate">{item.product.description}</p>}
          </div>
          <WishButton product={item.product} className="w-10 h-10 rounded-full hover:bg-red-50 shrink-0" />
        </Link>
      )}
    </li>
  )
}

function Following() {
  const dispatch = useDispatch()
  const { following, loading, error } = useSelector((state) => state.farms)
  const [feed, setFeed] = useState(null)
  const [feedError, setFeedError] = useState('')

  useEffect(()=>{
    dispatch(loadFollowing())
    get('/farms/feed')
      .then((d) => setFeed(d.items))
      .catch((e) => setFeedError(e.message))
  }, [dispatch])

  if (!loading && following.length === 0 && feed) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Farms you follow</h1>
        <div className="empty">
          <p>You are not following any farms yet.</p>
          <Link to="/farms" className="btn mt-4">
            Find farms near you
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <section className="lg:col-span-2">
        <h1 className="text-2xl font-bold">Latest from your farms</h1>
        <p className="muted mb-4">Updates and new products from the farms you follow, last 60 days.</p>
        {feedError && <ErrorMsg message={feedError} />}
        {!feed && !feedError && <Loader />}
        {feed && feed.length === 0 && <p className="empty">Nothing new from your farms lately.</p>}
        {feed && (
          <ul className="flex flex-col gap-3">
            {feed.map((item) => (
              <FeedItem key={item.kind + (item.update ? item.update.id : item.product.id)} item={item} />
            ))}
          </ul>
        )}
      </section>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
        <div className="card p-4">
          <FarmNewsToggle />
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-3">Farms you follow ({following.length})</h2>
          {loading && <Loader />}
          {error && <ErrorMsg message={error} />}
          <ul className="flex flex-col divide-y divide-gray-100">
            {following.map((f) => (
              <li key={f.farm.id} className="py-2.5">
                <Link to={'/farms/' + f.farm.id} className="font-medium hover:underline">
                  {f.farm.farmName}
                </Link>
                <p className="muted">
                  {f.farm.location} &middot; {f.productCount} products
                  {f.latestUpdate ? ' · last post ' + ShortDate(f.latestUpdate.createdAt) : ''}
                </p>
              </li>
            ))}
          </ul>
          <Link to="/farms" className="link text-sm inline-block mt-3">
            Find more farms
          </Link>
        </div>
      </aside>
    </div>
  )
}

export default Following
