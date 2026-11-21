const { build } = require('./emails')

const MAIL_URL = process.env.MAIL_URL
const MAIL_KEY = process.env.MAIL_KEY
const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')

const DEMO_DOMAINS = ['test.com', 'farm.com', 'farmdirect.com']

function canmail(email) {
  if (!MAIL_URL || !MAIL_KEY || !email) return false
  const domain = String(email).split('@')[1] || ''
  return DEMO_DOMAINS.indexOf(domain.toLowerCase()) === -1
}

function link(path) {
  return APP_URL + path
}

async function post(body) {
  const res = await fetch(MAIL_URL.replace(/\/$/, '') + '/farmdirect/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-FarmDirect-Key': MAIL_KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  })
  return { ok: res.ok, status: res.status, text: res.ok ? '' : await res.text() }
}

function sendmail(type, to, data) {
  if (!canmail(to)) return
  let email
  try {
    email = build(type, data)
  } catch (err) {
    return console.log('mail ' + type + ' not built: ' + err.message)
  }
  post({ type: 'custom', to: to, data: email })
    .then((res) => {
      if (!res.ok)
        console.log('mail ' + type + ' to ' + to + ' failed: ' + res.status + ' ' + res.text.slice(0, 200))
    })
    .catch((err) => console.log('mail ' + type + ' to ' + to + ' failed: ' + err.message))
}

module.exports = { sendmail, link }
