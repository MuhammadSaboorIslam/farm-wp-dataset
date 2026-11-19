import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '../redux/cart'
import { flash } from '../redux/ui'
import { money } from '../helpers'
import { Img, Stars, Icon } from './Bits'
import WishButton from './WishButton'

function ProductCard({ product }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  function quickadd(e) {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    dispatch(addToCart({ product: product, qty: 1 }))
    flash(dispatch, 'ok', '1 ' + product.unit + ' of ' + product.name + ' added to cart')
  }

  const canBuy = product.quantity > 0 && (!user || user.role === 'customer')

  return (
    <Link
      to={'/products/' + product.id}
      className="card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition block group"
    >
      <div className="relative overflow-hidden">
        <Img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-44 group-hover:scale-105 transition duration-300"
        />
        <span className="absolute top-2 left-2 bg-white/90 text-xs px-2 py-0.5 rounded-full">
          {product.category}
        </span>
        {product.quantity == 0 && (
          <span className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
            Sold out
          </span>
        )}
        <WishButton
          product={product}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 shadow hover:scale-110"
        />
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{product.name}</h3>
          <p className="text-green-700 font-bold whitespace-nowrap">
            {money(product.price)}
            <span className="muted font-normal"> / {product.unit}</span>
          </p>
        </div>
        <p className="muted">
          {product.farmer ? product.farmer.farmName : ''} &middot; {product.location}
        </p>
        <div className="flex items-center justify-between mt-2">
          <Stars rating={product.rating} count={product.reviewCount} />
          {canBuy && (
            <button
              className="btn w-8 h-8 p-0 rounded-full inline-flex items-center justify-center"
              title="Add to cart"
              onClick={quickadd}
            >
              <Icon name="plus" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
