const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Product = require('../models/Product')
const { accountuser } = require('../helpers')
const { sendmail, link } = require('../mailer')

function maketoken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

const WEEK = 7 * 24 * 60 * 60 * 1000

function setcookie(res, user) {
  res.cookie('token', maketoken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: WEEK,
  })
}

function getextras(role, body) {
  function text(key) {
    return String(body[key] || '').trim()
  }
  if (role === 'farmer') {
    const size = Number(body.farmSize)
    return {
      farmName: text('farmName'),
      location: text('location'),
      bio: text('bio'),
      phone: text('phone'),
      crops: text('crops'),
      farmSize: size > 0 ? size : null,
    }
  }
  if (role === 'rider') {
    return { phone: text('phone'), vehicle: text('vehicle'), city: text('city') }
  }
  return { phone: text('phone'), address: text('address'), city: text('city') }
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body
    const role = req.body.role || 'customer'
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    if (['customer', 'farmer', 'rider'].indexOf(role) === -1) {
      return res.status(400).json({ message: 'Cannot register as ' + role })
    }
    const extras = getextras(role, req.body)
    if (role === 'farmer' && (!extras.farmName || !extras.location)) {
      return res.status(400).json({ message: 'Farm name and location are needed for a farmer account' })
    }
    if (role === 'rider' && (!extras.phone || !extras.vehicle)) {
      return res.status(400).json({ message: 'Phone and vehicle are needed for a rider account' })
    }
    if (extras.phone && !/^\d{10,13}$/.test(extras.phone)) {
      return res.status(400).json({ message: 'Phone should be 10 to 13 digits' })
    }
    const taken = await User.findOne({ email: String(email).trim().toLowerCase() })
    if (taken) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hash, role, ...extras })
    let home = '/'
    if (role === 'farmer') {
      home = '/farmer'
    }
    if (role === 'rider') {
      home = '/rider'
    }
    sendmail('welcome', user.email, {
      name: user.name,
      role: user.role,
      farmName: user.farmName,
      link: link(home),
    })
    setcookie(res, user)
    res.status(201).json({ user: accountuser(user) })
  } catch (err) {
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({
      email: String(email || '')
        .trim()
        .toLowerCase(),
    }).select('+password')
    if (!user) {
      return res.status(400).json({ message: 'Wrong credentials' })
    }
    const ok = await bcrypt.compare(password || '', user.password)
    if (!ok) {
      return res.status(400).json({ message: 'Wrong credentials' })
    }
    if (user.blocked) {
      return res.status(403).json({ message: 'This account has been blocked. Contact the admin.' })
    }
    setcookie(res, user)
    res.json({ user: accountuser(user) })
  } catch (err) {
    next(err)
  }
}

function logout(req, res) {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  res.json({ ok: true })
}

async function me(req, res) {
  res.json({ user: accountuser(req.user) })
}

async function updateMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
    const name = String(req.body.name || '').trim()
    if (!name) {
      return res.status(400).json({ message: 'Name is required' })
    }
    const extras = user.role === 'admin' ? {} : getextras(user.role, req.body)
    if (user.role === 'farmer' && (!extras.farmName || !extras.location)) {
      return res.status(400).json({ message: 'Farm name and location are needed for a farmer account' })
    }
    if (user.role === 'rider' && (!extras.phone || !extras.vehicle)) {
      return res.status(400).json({ message: 'Phone and vehicle are needed for a rider account' })
    }
    if (extras.phone && !/^\d{10,13}$/.test(extras.phone)) {
      return res.status(400).json({ message: 'Phone should be 10 to 13 digits' })
    }
    const oldLocation = user.location
    user.name = name
    Object.assign(user, extras)
    await user.save()
    if (user.role === 'farmer' && user.location !== oldLocation) {
      await Product.updateMany({ farmer: user._id }, { location: user.location })
    }
    res.json({ user: accountuser(user) })
  } catch (err) {
    next(err)
  }
}

async function changePassword(req, res, next) {
  try {
    const { current, password } = req.body
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'New password should be at least 6 characters' })
    }
    const user = await User.findById(req.user._id).select('+password')
    const ok = await bcrypt.compare(current || '', user.password)
    if (!ok) {
      return res.status(400).json({ message: 'Current password is wrong' })
    }
    user.password = await bcrypt.hash(password, 10)
    user.passwordChangedAt = new Date()
    await user.save()
    setcookie(res, user)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

const RESET_MINUTES = 60

function hashtoken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

async function forgotPassword(req, res, next) {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase()
    const answer = { ok: true, message: 'If that email has an account, a reset link is on its way.' }
    if (!email) {
      return res.status(400).json({ message: 'Enter your email' })
    }
    const user = await User.findOne({
      email: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    })
    if (!user) {
      return res.json(answer)
    }
    const issuedAt = user.resetTokenExpires ? user.resetTokenExpires.getTime() - RESET_MINUTES * 60000 : 0
    if (Date.now() - issuedAt < 60000) {
      return res.json(answer)
    }
    const token = crypto.randomBytes(32).toString('hex')
    user.resetTokenHash = hashtoken(token)
    user.resetTokenExpires = new Date(Date.now() + RESET_MINUTES * 60000)
    await user.save()
    const url = link('/reset-password?token=' + token)
    sendmail('password_reset', user.email, { name: user.name, link: url, minutes: RESET_MINUTES })
    if (process.env.NODE_ENV !== 'production') {
      console.log('password reset link for ' + user.email + ': ' + url)
    }
    res.json(answer)
  } catch (err) {
    next(err)
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'New password should be at least 6 characters' })
    }
    const user = token
      ? await User.findOne({ resetTokenHash: hashtoken(token), resetTokenExpires: { $gt: new Date() } })
      : null
    if (!user) {
      return res
        .status(400)
        .json({ message: 'This reset link is invalid or has expired. Ask for a new one.' })
    }
    user.password = await bcrypt.hash(password, 10)
    user.passwordChangedAt = new Date()
    user.resetTokenHash = null
    user.resetTokenExpires = null
    await user.save()
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

async function updateSettings(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
    if (typeof req.body.emailFarmNews === 'boolean') user.emailFarmNews = req.body.emailFarmNews
    await user.save()
    res.json({ user: accountuser(user) })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  updateSettings,
}
