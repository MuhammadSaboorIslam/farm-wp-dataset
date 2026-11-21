import { useState } from 'react'
import { Link } from 'react-router-dom'
import { post } from '../api'
import AuthSplit from '../components/AuthSplit'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [sending, setSending] = useState(false)
  const [formerror, setFormerror] = useState('')

  async function handlesubmit(e) {
    e.preventDefault()
    if (!email.trim()) {
      setFormerror('Enter the email you signed up with')
      return
    }
    setFormerror('')
    setSending(true)
    try {
      await post('/auth/forgot', { email: email.trim() })
      setSentTo(email.trim())
    } catch (err) {
      setFormerror(err.message)
    }
    setSending(false)
  }

  return (
    <AuthSplit mode="forgot">
      <div className="slide-in">
        <h1 className="text-3xl font-bold text-green-800">Forgot password</h1>
        {sentTo ? (
          <div className="mt-4">
            <p className="text-gray-700">
              If <b>{sentTo}</b> has a FarmDirect account, we have sent it a link to choose a new password. It
              works for one hour.
            </p>
            <p className="muted mt-3">
              Nothing there? Check your spam folder, or{' '}
              <button type="button" className="link cursor-pointer" onClick={() => setSentTo('')}>
                try another email
              </button>
              .
            </p>
            <Link to="/login" className="btn w-full py-3 mt-6 text-center">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="muted mt-1 mb-6">Enter your email and we will send you a reset link.</p>
            <form onSubmit={handlesubmit}>
              <label className="label">
                Email
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              {formerror && <p className="err">{formerror}</p>}
              <button type="submit" className="btn w-full py-3" disabled={sending}>
                {sending ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <p className="text-sm mt-4">
              Remembered it?{' '}
              <Link to="/login" className="link">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthSplit>
  )
}

export default ForgotPassword
