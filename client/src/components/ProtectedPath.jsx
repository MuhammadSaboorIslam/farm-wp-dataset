import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

function ProtectedPath({ roles, children }) {
  const user = useSelector((state) => state.auth.user)

  if (!user) {
    return <Navigate to="/login" />
  }
  if (roles && roles.indexOf(user.role) === -1) {
    return <Navigate to="/" />
  }
  return children
}

export default ProtectedPath
