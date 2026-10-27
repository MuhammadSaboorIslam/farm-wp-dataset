const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

function makeToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, verified: user.verified }
}

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    if (role === 'admin') {
      return res.status(400).json({ message: 'Cannot register as admin' })
    }
    const taken = await User.findOne({ email: email })
    if (taken) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hash, role: role || 'customer' })
    res.status(201).json({ user: publicUser(user), token: makeToken(user) })
  } catch (err) {
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: email })
    if (!user) {
      return res.status(400).json({ message: 'Wrong credentials' })
    }
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return res.status(400).json({ message: 'Wrong credentials' })
    }
    res.json({ user: publicUser(user), token: makeToken(user) })
  } catch (err) {
    next(err)
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id)
    res.json({ user: publicUser(user) })
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, me }
