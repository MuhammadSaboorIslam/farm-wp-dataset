import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { post } from '../api'
import { flash } from '../redux/ui'
import AuthSplit from '../components/AuthSplit'

function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [formerror, setFormerror] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  async function handlesubmit(e) {
    e.preventDefault()
    if (password.length < 6) {
      setFormerror('New password should be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setFormerror('The two passwords do not match')
      return
    }
    setFormerror('')
    setSaving(true)
    try {
      await post('/auth/reset', { token: token, password: password })
      flash(dispatch, 'ok', 'Password changed. Log in with your new password.')
      navigate('/login')
    } catch (err) {
      setFormerror(err.message)
      setSaving(false)
    }
  }

  return (
    <AuthSplit mode="reset">
      <div className="slide-in">
        <h1 className="text-3xl font-bold text-green-800">Choose a new password</h1>
        {!token ? (
          <p className="text-gray-700 mt-4">
            This link is missing its code.{' '}
            <Link to="/forgot-password" className="link">
              Ask for a new reset link
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="muted mt-1 mb-6">Use at least 6 characters.</p>
            <form onSubmit={handlesubmit}>
              <label className="label">
                New password
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label className="label">
                Repeat new password
                <input
                  type="password"
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              {formerror && (
                <p className="err">
                  {formerror}{' '}
                  {formerror.includes('expired') && (
                    <Link to="/forgot-password" className="link">
                      Get a new link
                    </Link>
                  )}
                </p>
              )}
              <button type="submit" className="btn w-full py-3" disabled={saving}>
                {saving ? 'Saving...' : 'Save new password'}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthSplit>
  )
}

export default ResetPassword
