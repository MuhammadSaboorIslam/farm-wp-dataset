const jwt = require('jsonwebtoken')
const User = require('./models/User')

async function finduser(req) {
  const token = req.cookies.token
  if (!token) {
    return null
  }
  const data = jwt.verify(token, process.env.JWT_SECRET)
  const user = await User.findById(data.id).select('-password')
  if (user && user.passwordChangedAt) {
    const changed = Math.floor(user.passwordChangedAt.getTime() / 1000)
    if (data.iat < changed) {
      return null
    }
  }
  return user
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
