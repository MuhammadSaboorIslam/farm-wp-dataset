import { useState } from 'react'
import { STATUS_LABELS } from '../redux/orders'

export function Loader() {
  return <p className="text-center text-gray-500 py-10">Loading...</p>
}

export function ErrorMsg({ message }) {
  return (
    <p className="bg-red-50 text-red-700 border border-red-200 rounded px-4 py-3 my-4">
      Something went wrong: {message}
    </p>
  )
}

const PILL = {
  placed: 'bg-yellow-100 text-yellow-800',
  packed: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export function StatusPill({ status }) {
  return (
    <span
      className={
        'inline-block text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ' +
        (PILL[status] || 'bg-gray-100')
      }
    >
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function Stars({ rating, count, onPick }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    const n = i
    let cls = 'text-gray-300'
    if (i <= Math.round(rating)) {
      cls = 'text-yellow-400'
    }
    if (onPick) {
      stars.push(
        <button
          type="button"
          key={n}
          className={cls + ' text-2xl cursor-pointer hover:text-yellow-500'}
          onClick={() => onPick(n)}
        >
          &#9733;
        </button>,
      )
    } else {
      stars.push(
        <span key={n} className={cls}>
          &#9733;
        </span>,
      )
    }
  }
  return (
    <span className="inline-flex items-center gap-0.5">
      {stars}
      {count !== undefined && <span className="muted ml-1"> {(rating || 0) + ' (' + count + ')'}</span>}
    </span>
  )
}

export function Img({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false)
  let url = src
  if (!url || failed) {
    url = '/img/placeholder.svg'
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={'object-cover bg-gray-100 ' + className}
      onError={() => setFailed(true)}
    />
  )
}

export function Icon({ name, className = '' }) {
  return <img src={'/icons/' + name + '.png'} alt="" loading="lazy" className={'inline-block ' + className} />
}
