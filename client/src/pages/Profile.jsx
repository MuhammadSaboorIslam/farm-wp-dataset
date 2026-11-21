import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { updateProfile, changePassword } from '../redux/auth'
import { flash } from '../redux/ui'
import { ShortDate } from '../helpers'
import RoleFields from '../components/RoleFields'
import FarmNewsToggle from '../components/FarmNewsToggle'

const ROLE_NAMES = { customer: 'Customer', farmer: 'Farmer', rider: 'Rider', admin: 'Admin' }

const LINKS = {
  customer: [
    { to: '/orders', label: 'My orders' },
    { to: '/following', label: 'Farms I follow' },
    { to: '/cart', label: 'Cart' },
  ],
  farmer: [
    { to: '/farmer', label: 'Dashboard' },
    { to: '/farmer/products/new', label: 'Add a product' },
  ],
  rider: [{ to: '/rider', label: 'My deliveries' }],
  admin: [{ to: '/admin', label: 'Admin panel' }],
}

function fromuser(user) {
  const form = {}
  const keys = [
    'name',
    'phone',
    'address',
    'city',
    'farmName',
    'location',
    'farmSize',
    'crops',
    'bio',
    'vehicle',
  ]
  for (const k of keys) {
    form[k] = user[k] === null || user[k] === undefined ? '' : String(user[k])
  }
  return form
}

function Profile() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const [form, setForm] = useState(() => fromuser(user))
  const [saving, setSaving] = useState(false)
  const [formerror, setFormerror] = useState('')
  const [pw, setPw] = useState({ current: '', password: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')

  function field(key) {
    return { value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) }
  }

  async function savedetails(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormerror('Name is required')
      return
    }
    if (form.phone.trim() && !/^\d{10,13}$/.test(form.phone.trim())) {
      setFormerror('Phone should be 10 to 13 digits')
      return
    }
    setFormerror('')
    setSaving(true)
    const body = {}
    for (const k in form) {
      body[k] = form[k].trim()
    }
    const result = await dispatch(updateProfile(body))
    setSaving(false)
    if (result.error) {
      setFormerror(result.error.message)
    } else {
      setForm(fromuser(result.payload.user))
      flash(dispatch, 'ok', 'Profile saved')
    }
  }

  async function savepassword(e) {
    e.preventDefault()
    if (pw.password.length < 6) {
      setPwError('New password should be at least 6 characters')
      return
    }
    if (pw.password !== pw.confirm) {
      setPwError('The new passwords do not match')
      return
    }
    setPwError('')
    setPwSaving(true)
    const result = await dispatch(changePassword({ current: pw.current, password: pw.password }))
    setPwSaving(false)
    if (result.error) {
      setPwError(result.error.message)
    } else {
      setPw({ current: '', password: '', confirm: '' })
      flash(dispatch, 'ok', 'Password changed')
    }
  }

  const links = (LINKS[user.role] || []).slice()
  if (user.role === 'farmer') {
    links.unshift({ to: '/farms/' + user.id, label: 'My public farm page' })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <aside className="card p-6 text-center md:sticky md:top-20">
        <span className="mx-auto w-20 h-20 rounded-full bg-green-700 text-white text-3xl font-bold flex items-center justify-center">
          {user.name[0].toUpperCase()}
        </span>
        <h1 className="text-xl font-bold mt-3">{user.name}</h1>
        <p className="muted break-all">{user.email}</p>
        <div className="flex justify-center flex-wrap gap-2 mt-3">
          <span className="text-xs font-medium bg-green-50 text-green-800 px-2.5 py-1 rounded-full">
            {ROLE_NAMES[user.role]}
          </span>
          {user.role === 'farmer' &&
            (user.verified ? (
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                &#10003; Verified farm
              </span>
            ) : (
              <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full">
                Waiting for verification
              </span>
            ))}
        </div>
        {user.createdAt && <p className="muted mt-3">Member since {ShortDate(user.createdAt)}</p>}
        {links.length > 0 && (
          <ul className="mt-5 pt-4 border-t border-gray-100 text-sm flex flex-col gap-2">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="md:col-span-2 flex flex-col gap-6">
        <form className="card p-6" onSubmit={savedetails}>
          <h2 className="text-lg font-semibold mb-4">Your details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <label className="label">
              Name
              <input className="input" {...field('name')} />
            </label>
            <label className="label">
              Email
              <input className="input" value={user.email} disabled />
            </label>
          </div>
          <RoleFields role={user.role} field={field} />
          {formerror && <p className="err">{formerror}</p>}
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>

        {user.role === 'customer' && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Email settings</h2>
            <FarmNewsToggle />
            <p className="muted mt-3">Order, password and account emails are always sent.</p>
          </div>
        )}

        <form className="card p-6" onSubmit={savepassword}>
          <h2 className="text-lg font-semibold mb-4">Change password</h2>
          <label className="label">
            Current password
            <input
              type="password"
              className="input"
              autoComplete="current-password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <label className="label">
              New password
              <input
                type="password"
                className="input"
                autoComplete="new-password"
                value={pw.password}
                onChange={(e) => setPw({ ...pw, password: e.target.value })}
                placeholder="At least 6 characters"
              />
            </label>
            <label className="label">
              Repeat new password
              <input
                type="password"
                className="input"
                autoComplete="new-password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              />
            </label>
          </div>
          {pwError && <p className="err">{pwError}</p>}
          <button type="submit" className="btn-ghost" disabled={pwSaving}>
            {pwSaving ? 'Changing...' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
