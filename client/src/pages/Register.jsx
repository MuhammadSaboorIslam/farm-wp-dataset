import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, clearAuthError } from '../redux/auth'
import AuthSplit from '../components/AuthSplit'
import RoleFields from '../components/RoleFields'

const HOME = { customer: '/', farmer: '/farmer', rider: '/rider' }

const ROLES = [
  {
    key: 'customer',
    title: 'Customer',
    icon: '/icons/cart.png',
    text: 'Buy fresh food straight from the farm',
  },
  { key: 'farmer', title: 'Farmer', icon: '/icons/tractor.png', text: 'Sell your harvest without middlemen' },
  { key: 'rider', title: 'Rider', icon: '/icons/scooter.svg', text: 'Deliver orders and earn per trip' },
]

const EMPTY = {
  name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  city: '',
  farmName: '',
  location: '',
  farmSize: '',
  crops: '',
  bio: '',
  vehicle: '',
}

function RolePicker({ onPick }) {
  const words = ['Who', 'are', 'you?']
  const title = []
  for (let i = 0; i < words.length; i++) {
    title.push(
      <span key={i} className="rise inline-block mr-[0.3em]" style={{ animationDelay: i * 0.12 + 's' }}>
        {words[i]}
      </span>,
    )
  }
  const cards = []
  for (let i = 0; i < ROLES.length; i++) {
    const r = ROLES[i]
    cards.push(
      <button
        key={r.key}
        type="button"
        className="role-card pop"
        style={{ animationDelay: 0.35 + i * 0.12 + 's' }}
        onClick={() => onPick(r.key)}
      >
        <span className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center shrink-0">
          <img src={r.icon} alt="" className="w-10 h-10 bob" style={{ animationDelay: i * 0.4 + 's' }} />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-semibold">{r.title}</span>
          <span className="block muted">{r.text}</span>
        </span>
        <span className="text-green-700 text-xl" aria-hidden="true">
          &rarr;
        </span>
      </button>,
    )
  }
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-bold text-green-800">{title}</h1>
      <p className="muted mt-2 rise" style={{ animationDelay: '0.3s' }}>
        Pick one and we will show you the right sign up form.
      </p>
      <div className="flex flex-col gap-3 mt-8">{cards}</div>
      <p className="text-sm mt-8 rise" style={{ animationDelay: '0.8s' }}>
        Already have an account?{' '}
        <Link to="/login" className="link">
          Login
        </Link>
      </p>
    </>
  )
}

function Register() {
  const [role, setRole] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [formerror, setFormerror] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, error, loading } = useSelector((state) => state.auth)

  useEffect(()=>{
    dispatch(clearAuthError())
  }, [dispatch])

  useEffect(()=>{
    if (user) {
      navigate(HOME[user.role] || '/')
    }
  }, [user, navigate])

  function field(key) {
    return { value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) }
  }

  function pick(key) {
    setRole(key)
    setFormerror('')
    dispatch(clearAuthError())
    if (key === 'rider' && !form.vehicle) {
      setForm({ ...form, vehicle: 'motorbike' })
    }
  }

  function handlesubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormerror('Name, email and password are needed')
      return
    }
    if (form.password.length < 6) {
      setFormerror('Password should be at least 6 characters')
      return
    }
    if (role === 'farmer' && (!form.farmName.trim() || !form.location.trim())) {
      setFormerror('Farm name and location are needed for a farmer account')
      return
    }
    if (role === 'rider' && !form.phone.trim()) {
      setFormerror('Riders need a phone number so customers can reach them')
      return
    }
    if (form.phone.trim() && !/^\d{10,13}$/.test(form.phone.trim())) {
      setFormerror('Phone should be 10 to 13 digits')
      return
    }
    setFormerror('')
    const body = { role: role }
    for (const key in form) {
      body[key] = key === 'password' ? form.password : form[key].trim()
    }
    if (role === 'customer' && body.address) {
      localStorage.setItem('address', body.address + (body.city ? ', ' + body.city : ''))
    }
    if (role === 'customer' && body.phone) {
      localStorage.setItem('phone', body.phone)
    }
    dispatch(registerUser(body))
  }

  if (!role) {
    return (
      <AuthSplit mode="pick">
        <RolePicker onPick={pick} />
      </AuthSplit>
    )
  }

  const chosen = ROLES.find((r) => r.key === role)

  return (
    <AuthSplit mode={role}>
      <div key={role} className="slide-in">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <img src={chosen.icon} alt="" className="w-7 h-7" />
          </span>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Sign up as a {chosen.title.toLowerCase()}</h2>
            <p className="muted">{chosen.text}</p>
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setRole(null)}>
            Change
          </button>
        </div>

        <form onSubmit={handlesubmit}>
          <label className="label">
            Name
            <input type="text" className="input" {...field('name')} placeholder="Your name" />
          </label>
          <label className="label">
            Email
            <input type="email" className="input" {...field('email')} placeholder="you@example.com" />
          </label>
          <label className="label">
            Password
            <input
              type="password"
              className="input"
              {...field('password')}
              placeholder="At least 6 characters"
            />
          </label>

          <RoleFields role={role} field={field} signup />

          {(formerror || error) && <p className="err">{formerror || error}</p>}
          <button type="submit" className="btn w-full py-3" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="text-sm mt-4">
          Already have an account?{' '}
          <Link to="/login" className="link">
            Login
          </Link>
        </p>
      </div>
    </AuthSplit>
  )
}

export default Register
