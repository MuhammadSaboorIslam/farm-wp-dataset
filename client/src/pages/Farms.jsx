import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { get, post, del, toquery } from '../api'
import { flash } from '../redux/ui'
import { Img, Stars, Loader, ErrorMsg } from '../components/Bits'

function distancetext(km) {
  if (km === null || km === undefined) return null
  if (km < 10) return 'In your city'
  return 'About ' + km.toLocaleString() + ' km away'
}

function FarmCard({ item, canFollow, onFollow }) {
  const f = item.farm
  const away = distancetext(item.distanceKm)
  return (
    <div className="card overflow-hidden flex flex-col hover:shadow-lg transition">
      <Link to={'/farms/' + f.id} className="relative block">
        <Img src={item.coverImage} alt={f.farmName} className="w-full h-40" />
        {away && (
          <span
            className={
              'absolute top-2 left-2 text-xs font-medium px-2.5 py-1 rounded-full shadow ' +
              (item.distanceKm < 10 ? 'bg-green-700 text-white' : 'bg-white/95 text-gray-800')
            }
          >
            {away}
          </span>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link to={'/farms/' + f.id} className="text-lg font-semibold hover:underline">
          {f.farmName}
        </Link>
        <p className="muted">
          {f.name} &middot; {f.location}
        </p>
        <div className="mt-1">
          <Stars rating={item.rating} count={item.reviewCount} />
        </div>
        {f.crops && <p className="text-sm text-gray-600 mt-2 line-clamp-2">Grows {f.crops}</p>}
        <p className="text-sm text-gray-500 mt-2">
          {item.productCount} product{item.productCount === 1 ? '' : 's'} &middot; {item.followers} follower
          {item.followers === 1 ? '' : 's'}
        </p>
        <div className="flex gap-2 mt-auto pt-4">
          <Link to={'/farms/' + f.id} className="btn btn-sm flex-1 text-center py-2">
            View farm
          </Link>
          {canFollow && (
            <button
              type="button"
              className={(item.following ? 'btn-ghost bg-green-50' : 'btn-ghost') + ' btn-sm py-2'}
              onClick={() => onFollow(item)}
            >
              {item.following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Farms() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const home = user ? (user.role === 'farmer' ? user.location : user.city) : ''
  const [cities, setCities] = useState([])
  const [where, setWhere] = useState(home ? { city: home } : {})
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)

  useEffect(()=>{
    get('/farms/cities')
      .then((d) => setCities(d.cities))
      .catch(() => {})
  }, [])

  useEffect(()=>{
    let live = true
    get('/farms' + toquery({ ...where, q: search }))
      .then((d) => {
        if (live) {
          setData(d)
          setError('')
        }
      })
      .catch((e) => {
        if (live) setError(e.message)
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [where, search])

  function change(next) {
    setLoading(true)
    setWhere(next)
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      flash(dispatch, 'warn', 'Your browser cannot share its location, pick a city instead')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        change({ lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4) })
      },
      () => {
        setLocating(false)
        flash(dispatch, 'warn', 'Location was blocked, pick your city instead')
      },
      { timeout: 10000 },
    )
  }

  function submitsearch(e) {
    e.preventDefault()
    setLoading(true)
    setSearch(q.trim())
  }

  async function follow(item) {
    try {
      const res = item.following
        ? await del('/farms/' + item.farm.id + '/follow')
        : await post('/farms/' + item.farm.id + '/follow')
      setData({
        ...data,
        farms: data.farms.map((x) =>
          x.farm.id === item.farm.id ? { ...x, following: res.following, followers: res.followers } : x,
        ),
      })
    } catch (err) {
      flash(dispatch, 'warn', err.message)
    }
  }

  const usingGps = where.lat !== undefined
  const canFollow = !!user && user.role === 'customer'
  let gpstext = 'Use my location'
  if (usingGps) gpstext = 'Using your location'
  if (locating) gpstext = 'Finding you...'

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Farms near you</h1>
        <p className="muted">Buy from farms close by, your food travels less and arrives fresher.</p>
      </div>

      <div className="card p-4 mb-5 flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end flex-1">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className={
              'btn inline-flex items-center justify-center gap-2 py-2.5 ' +
              (usingGps ? 'ring-2 ring-green-300' : '')
            }
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="7" />
            </svg>
            {gpstext}
          </button>
          <label className="label mb-0 flex-1">
            Or choose a city
            <select
              className="input"
              value={where.city || ''}
              onChange={(e) => change(e.target.value ? { city: e.target.value } : {})}
            >
              <option value="">Any city (no distance)</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <form className="flex gap-2 lg:w-80" onSubmit={submitsearch}>
          <label className="label mb-0 flex-1">
            Search
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Farm, town or crop"
            />
          </label>
          <button type="submit" className="btn-ghost self-end py-2.5">
            Search
          </button>
        </form>
      </div>

      {error && <ErrorMsg message={error} />}
      {!data && loading && <Loader />}
      {data && (
        <div className={'transition-opacity ' + (loading ? 'opacity-50' : '')}>
          <p className="text-sm text-gray-600 mb-3">
            {data.farms.length} farm{data.farms.length === 1 ? '' : 's'}
            {data.near ? (
              <>
                , nearest to <b>{data.near}</b> first
              </>
            ) : (
              ', pick a city or use your location to sort by distance'
            )}
            {search && <> matching &ldquo;{search}&rdquo;</>}
          </p>
          {data.farms.length === 0 && <p className="empty">No farms found. Try another search.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.farms.map((item) => (
              <FarmCard key={item.farm.id} item={item} canFollow={canFollow} onFollow={follow} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Farms
