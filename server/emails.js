const path = require('path')
const fs = require('fs')
const ejs = require('ejs')

const folder = path.join(__dirname, 'views', 'emails')

const STATUS = {
  packed: ['is packed', 'The farm has packed your order. A rider will pick it up soon.'],
  out_for_delivery: [
    'is out for delivery',
    'Your order is on its way. Keep the cash ready, it is paid on delivery.',
  ],
  delivered: [
    'was delivered',
    'Enjoy your fresh food. You can leave a review on each product from the order page.',
  ],
  cancelled: ['was cancelled', 'This order was cancelled. Nothing is owed.'],
}

function money(n) {
  return 'Rs ' + Math.round(Number(n) || 0).toLocaleString('en-US')
}

function shortid(id) {
  return (
    '#' +
    String(id || '')
      .slice(-6)
      .toUpperCase()
  )
}

function build(type, d) {
  const data = Object.assign({}, d)
  if (!data.items) {
    data.items = []
  }
  const link = d.link || ''
  const id = shortid(d.orderId)
  data.link = link
  data.id = id
  let file = type
  let subject = ''
  let text = ''

  if (type === 'welcome') {
    subject = 'Welcome to FarmDirect'
    text = 'Welcome to FarmDirect, ' + d.name + '.\n' + link
  } else if (type === 'order_placed') {
    subject = 'Order ' + id + ' placed with ' + d.farmName
    text = 'Your order ' + id + ' was placed. Total ' + money(d.total) + '.\n' + link
  } else if (type === 'new_order') {
    subject = 'New order ' + id + ' from ' + d.customerName
    text = 'New order ' + id + ' to pack. Total ' + money(d.total) + '.\n' + link
  } else if (type === 'order_status') {
    const s = STATUS[d.status]
    if (!s) {
      throw new Error('unknown status ' + d.status)
    }
    data.statusLine = s[0]
    data.statusText = s[1]
    subject = 'Order ' + id + ' ' + s[0]
    text = 'Your order ' + id + ' ' + s[0] + '.\n' + link
  } else if (type === 'farm_verified') {
    if (d.approved) {
      subject = 'Your farm is verified'
      text = 'Your farm ' + d.farmName + ' is verified.\n' + link
    } else {
      file = 'farm_rejected'
      subject = 'Your farm was not approved'
      text = 'Your farm ' + d.farmName + ' was not approved.'
    }
  } else if (type === 'password_reset') {
    data.minutes = Number(d.minutes) || 60
    subject = 'Reset your FarmDirect password'
    text = 'Reset your FarmDirect password (expires in ' + data.minutes + ' minutes):\n' + link
  } else if (type === 'new_update') {
    subject = d.farmName + ': ' + d.title
    text = d.farmName + ' posted: ' + d.title + '\n\n' + (d.body || '') + '\n' + link
  } else if (type === 'new_product') {
    subject = d.farmName + ' added ' + d.productName
    text = d.farmName + ' added ' + d.productName + ' at ' + money(d.price) + ' / ' + d.unit + '.\n' + link
  } else {
    throw new Error('unknown email type ' + type)
  }

  const filename = path.join(folder, file + '.ejs')
  const html = ejs.render(
    fs.readFileSync(filename, 'utf8'),
    { d: data, money: money },
    { filename: filename },
  )
  return { subject: subject, html: html, text: text }
}

module.exports = { build }
