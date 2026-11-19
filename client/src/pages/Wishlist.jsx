import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { loadWishlist } from '../redux/wishlist'
import { Loader, ErrorMsg } from '../components/Bits'
import ProductCard from '../components/ProductCard'

function Wishlist() {
  const dispatch = useDispatch()
  const { products, loading, error } = useSelector((state) => state.wishlist)

  useEffect(()=>{
    dispatch(loadWishlist())
  }, [dispatch])

  return (
    <div>
      <h1 className="text-2xl font-bold">Saved for later</h1>
      <p className="muted mb-5">Products you saved. Tap the heart again to remove one.</p>
      {loading && products.length === 0 && <Loader />}
      {error && <ErrorMsg message={error} />}
      {!loading && !error && products.length === 0 && (
        <div className="empty">
          <p>Nothing saved yet.</p>
          <Link to="/" className="btn mt-4">
            Browse products
          </Link>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <div key={p.id} className={p.available ? '' : 'opacity-60'}>
            <ProductCard product={p} />
            {!p.available && <p className="text-xs text-red-600 mt-1">Not available right now</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Wishlist
