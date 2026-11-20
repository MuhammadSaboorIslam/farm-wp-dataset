import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateSettings } from '../redux/auth'
import { flash } from '../redux/ui'

function FarmNewsToggle({ compact = false }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const [saving, setSaving] = useState(false)
  const on = user.emailFarmNews !== false

  async function toggle() {
    setSaving(true)
    const result = await dispatch(updateSettings({ emailFarmNews: !on }))
    setSaving(false)
    if (result.error) flash(dispatch, 'warn', result.error.message)
    else flash(dispatch, 'ok', on ? 'Farm emails turned off' : 'Farm emails turned on')
  }

  return (
    <label className={'flex items-start gap-3 cursor-pointer ' + (compact ? 'text-sm' : '')}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        disabled={saving}
        className={
          'relative shrink-0 w-11 h-6 rounded-full transition cursor-pointer disabled:opacity-60 ' +
          (on ? 'bg-green-700' : 'bg-gray-300')
        }
      >
        <span
          className={
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ' +
            (on ? 'left-5.5' : 'left-0.5')
          }
        ></span>
      </button>
      <span>
        <span className="block font-medium text-gray-800">Email me farm news</span>
        {!compact && (
          <span className="block muted">
            When a farm you follow posts an update or adds a product. You always see them in the bell.
          </span>
        )}
      </span>
    </label>
  )
}

export default FarmNewsToggle
