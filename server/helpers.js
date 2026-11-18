const Review = require('./models/Review')
const Notification = require('./models/Notification')
const Follow = require('./models/Follow')
const { sendto } = require('./socket')
const { quote } = require('./delivery')

const orderFields = [
  { path: 'customer', select: 'name' },
  { path: 'farmer', select: 'name farmName location' },
  { path: 'rider', select: 'name' },
]
const farmerFields = 'name farmName location'

function idof(x) {
  if (!x) {
    return null
  }
  return String(x._id || x)
}

function publicUser(u) {
  if (!u) {
    return null
  }
  return {
    id: idof(u),
    name: u.name,
    email: u.email,
    role: u.role,
    verified: u.verified,
    farmName: u.farmName,
    location: u.location,
    bio: u.bio,
    farmSize: u.farmSize,
    crops: u.crops,
    rejected: u.rejected,
    blocked: u.blocked,
    createdAt: u.createdAt,
  }
}

function accountuser(u) {
  if (!u) {
    return null
  }
  return {
    ...publicUser(u),
    phone: u.phone,
    address: u.address,
    city: u.city,
    vehicle: u.vehicle,
    emailFarmNews: u.emailFarmNews !== false,
  }
}

function farmerinfo(u) {
  if (!u || !u._id) {
    return null
  }
  return { id: idof(u), name: u.name, farmName: u.farmName, location: u.location }
}

function nameinfo(u) {
  if (!u || !u._id) {
    return null
  }
  return { id: idof(u), name: u.name }
}

function average(sum, count) {
  return count ? Math.round((sum / count) * 10) / 10 : 0
}

async function ratingof(filter) {
  const list = await Review.find(filter).select('rating')
  let sum = 0
  for (let i = 0; i < list.length; i++) {
    sum += list[i].rating
  }
  return { rating: average(sum, list.length), reviewCount: list.length }
}

async function outProducts(products) {
  const ids = products.map((p) => p._id)
  const reviews = await Review.find({ product: { $in: ids } }).select('product rating')
  const totals = {}
  for (let i = 0; i < reviews.length; i++) {
    const key = String(reviews[i].product)
    if (!totals[key]) {
      totals[key] = { sum: 0, count: 0 }
    }
    totals[key].sum += reviews[i].rating
    totals[key].count++
  }
  const out = []
  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const t = totals[String(p._id)] || { sum: 0, count: 0 }
    out.push({
      id: idof(p),
      farmer: farmerinfo(p.farmer),
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      quantity: p.quantity,
      unit: p.unit,
      images: p.images,
      location: p.location,
      active: p.active,
      hidden: p.hidden,
      createdAt: p.createdAt,
      rating: average(t.sum, t.count),
      reviewCount: t.count,
    })
  }
  return out
}

async function outProduct(product) {
  const list = await outProducts([product])
  return list[0]
}

function outOrder(o) {
  const items = o.items.map((it) => ({
    product: idof(it.product),
    name: it.name,
    price: it.price,
    qty: it.qty,
    unit: it.unit,
    image: it.image,
  }))
  const history = o.history.map((h) => ({ status: h.status, at: h.at, by: h.by }))
  const pay =
    typeof o.deliveryFee === 'number'
      ? { deliveryFee: o.deliveryFee, distanceKm: o.distanceKm }
      : quote(o.farmer && o.farmer.location, o.address)
  return {
    id: idof(o),
    customer: nameinfo(o.customer),
    farmer: farmerinfo(o.farmer),
    rider: nameinfo(o.rider),
    items: items,
    total: o.total,
    deliveryFee: pay.deliveryFee,
    distanceKm: pay.distanceKm,
    address: o.address,
    phone: o.phone,
    status: o.status,
    history: history,
    createdAt: o.createdAt,
  }
}

function outUpdate(u) {
  return {
    id: idof(u),
    farmer: farmerinfo(u.farmer),
    title: u.title,
    body: u.body,
    images: u.images,
    createdAt: u.createdAt,
  }
}

function outReview(r) {
  return {
    id: idof(r),
    customer: nameinfo(r.customer),
    product: idof(r.product),
    farmer: idof(r.farmer),
    order: idof(r.order),
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  }
}

async function blockedids() {
  const User = require('./models/User')
  const list = await User.find({ role: 'farmer', blocked: true }).select('_id')
  return list.map((u) => u._id)
}

async function notify(userId, type, text, link) {
  const n = await Notification.create({ user: userId, type: type, text: text, link: link })
  sendto(userId, 'notification', {
    id: idof(n),
    type: n.type,
    text: n.text,
    link: n.link,
    read: false,
    createdAt: n.createdAt,
  })
}

async function notifyFollowers(farmerId, type, text, link, email) {
  const { sendmail, link: fullLink } = require('./mailer')
  const follows = await Follow.find({ farmer: farmerId }).populate(
    'customer',
    'name email emailFarmNews blocked',
  )
  for (let i = 0; i < follows.length; i++) {
    const c = follows[i].customer
    if (!c || c.blocked) continue
    await notify(c._id, type, text, link)
    if (email && c.emailFarmNews !== false) {
      sendmail(type, c.email, {
        ...email,
        name: c.name,
        link: fullLink(link),
        settings: fullLink('/profile'),
      })
    }
  }
}

function escaperegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

module.exports = {
  blockedids,
  orderFields,
  farmerFields,
  idof,
  publicUser,
  accountuser,
  ratingof,
  outProducts,
  outProduct,
  outOrder,
  outUpdate,
  outReview,
  notify,
  notifyFollowers,
  escaperegex,
}
