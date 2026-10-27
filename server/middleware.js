const jwt = require('jsonwebtoken')

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Please login' })
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (err) {
    res.status(401).json({ message: 'Session expired, login again' })
  }
}

function allow(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not allowed' })
    }
    next()
  }
}

module.exports = { auth, allow }
