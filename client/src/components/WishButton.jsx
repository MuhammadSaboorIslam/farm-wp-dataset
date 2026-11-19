import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toggleWish } from '../redux/wishlist'
import { flash } from '../redux/ui'

function WishButton({ product, className = '', withLabel = false }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const saved = useSelector((state) => state.wishlist.ids.includes(product.id))

  if (user && user.role !== 'customer') return null

  async function toggle(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    const result = await dispatch(toggleWish({ id: product.id, saved: saved }))
    if (result.error) {
      flash(dispatch, 'warn', result.error.message)
    } else if (!saved) {
      flash(dispatch, 'ok', product.name + ' saved for later')
    }
  }

  const label = saved ? 'Remove from saved' : 'Save for later'
  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      aria-pressed={saved}
      className={'inline-flex items-center justify-center gap-2 cursor-pointer transition ' + className}
    >
      <svg
        viewBox="0 0 24 24"
        className={'w-5 h-5 ' + (saved ? 'text-red-500' : 'text-gray-600')}
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z"
        />
      </svg>
      {withLabel && <span>{saved ? 'Saved' : 'Save for later'}</span>}
    </button>
  )
}

export default WishButton
