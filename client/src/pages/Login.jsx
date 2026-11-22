import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, clearAuthError } from '../redux/auth'
import AuthSplit from '../components/AuthSplit'

const HOME = { customer: '/', farmer: '/farmer', rider: '/rider', admin: '/admin' }

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  function handlesubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setFormerror('Please fill in both fields')
      return
    }
    setFormerror('')
    dispatch(loginUser({ email: email.trim(), password }))
  }

  return (
    <AuthSplit mode="login">
      <div className="slide-in">
        <h1 className="text-3xl font-bold text-green-800">Login</h1>
        <p className="muted mt-1 mb-6">Good to see you again.</p>
        <form onSubmit={handlesubmit}>
          <label className="label">
            Email
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="label">
            <span className="flex justify-between">
              Password{' '}
              <Link to="/forgot-password" className="link text-sm">
                Forgot password?
              </Link>
            </span>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {(formerror || error) && <p className="err">{formerror || error}</p>}
          <button type="submit" className="btn w-full py-3" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-sm mt-4">
          Dont have an account?{' '}
          <Link to="/register" className="link">
            Register
          </Link>
        </p>
      </div>
    </AuthSplit>
  )
}

export default Login
