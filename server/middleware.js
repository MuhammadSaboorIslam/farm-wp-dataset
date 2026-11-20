const jwt = require('jsonwebtoken')
const User = require('./models/User')

async function finduser(req) {
  let header = req.headers.authorization
  if (!header) {
    return null
  }
  const parts = header.split(' ')
  if (parts.length < 2 || parts[0] !== 'Bearer') {
    return null
  }
  const token = parts[1]
  const data = jwt.verify(token, process.env.JWT_SECRET)
  return User.findById(data.id).select('-password')
}

async function auth(req, res, next) {
  let user = null
  try {
    user = await finduser(req)
  } catch (err) {
    return res.status(401).json({ message: 'Session expired, login again' })
  }
  if (!user) {
    return res.status(401).json({ message: 'Please login' })
  }
  if (user.blocked) {
    return res.status(403).json({ message: 'This account has been blocked. Contact the admin.' })
  }
  req.user = user
  next()
}

async function maybeAuth(req, res, next) {
  try {
    req.user = await finduser(req)
    if (req.user && req.user.blocked) {
      req.user = null
    }
  } catch (err) {
    req.user = null
  }
  next()
}

function allow(...roles) {
  return function (req, res, next) {
    let ok = false
    for (let i = 0; i < roles.length; i++) {
      if (roles[i] === req.user.role) {
        ok = true
      }
    }
    if (!ok) {
      return res.status(403).json({ message: 'Not allowed' })
    }
    next()
  }
}

function verifiedFarmer(req, res, next) {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({ message: 'Not allowed' })
  }
  if (!req.user.verified) {
    return res.status(403).json({ message: 'Your farm is not verified yet' })
  }
  next()
}

module.exports = { auth, maybeAuth, allow, verifiedFarmer }
