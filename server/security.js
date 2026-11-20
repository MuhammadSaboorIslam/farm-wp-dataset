const helmet = require('helmet')
const sanitizeHtml = require('sanitize-html')
const { rateLimit } = require('express-rate-limit')

function allowedOrigins() {
  const port = process.env.PORT || 4000
  const raw = ['http://localhost:5173', 'http://localhost:' + port]
  if (process.env.APP_URL) {
    raw.push(process.env.APP_URL)
  }
  if (process.env.EXTRA_ORIGINS) {
    const extra = process.env.EXTRA_ORIGINS.split(',')
    for (let i = 0; i < extra.length; i++) {
      raw.push(extra[i])
    }
  }
  const list = []
  for (let i = 0; i < raw.length; i++) {
    let origin = raw[i].trim()
    if (origin.endsWith('/')) {
      origin = origin.slice(0, -1)
    }
    if (origin !== '' && list.indexOf(origin) === -1) {
      list.push(origin)
    }
  }
  return list
}

const corsOptions = {
  origin: function (origin, done) {
    if (!origin) {
      return done(null, true)
    }
    if (allowedOrigins().indexOf(origin) !== -1) {
      return done(null, true)
    }
    done(null, false)
  },
}

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      scriptSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
})

const SKIP = ['password', 'current', 'token', 'images', 'image']
function strip(text) {
  if (text.startsWith('data:image/')) {
    return text
  }
  let out = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} })
  out = out.replace(/&lt;/g, '<')
  out = out.replace(/&gt;/g, '>')
  out = out.replace(/&quot;/g, '"')
  out = out.replace(/&#39;/g, "'")
  out = out.replace(/&amp;/g, '&')
  return out
}

function clean(value, key) {
  if (SKIP.indexOf(key) !== -1) {
    return value
  }
  if (typeof value === 'string') {
    return strip(value)
  }
  if (Array.isArray(value)) {
    const list = []
    for (let i = 0; i < value.length; i++) {
      list.push(clean(value[i], key))
    }
    return list
  }
  if (value && typeof value === 'object') {
    const out = {}
    for (const k in value) {
      out[k] = clean(value[k], k)
    }
    return out
  }
  return value
}

function cleanbody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = clean(req.body)
  }
  next()
}

function toomany(message) {
  return function (req, res) {
    res.status(429).json({ message: message })
  }
}

function emailof(req) {
  if (req.body && req.body.email) {
    return String(req.body.email).toLowerCase()
  }
  return ''
}

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: function (req) {
    return 'login:' + emailof(req)
  },
  handler: toomany(
    'Too many wrong passwords for this email. Try again in 15 minutes or reset your password.',
  ),
})

const forgotLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: function (req) {
    return 'forgot:' + emailof(req)
  },
  handler: toomany('Too many reset requests. Try again in 15 minutes.'),
})

const registerLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  handler: toomany('Too many new accounts from this network. Try again later.'),
})

module.exports = {
  corsOptions,
  allowedOrigins,
  securityHeaders,
  cleanbody,
  loginLimit,
  forgotLimit,
  registerLimit,
}
