const Order = require('../models/Order')
const Product = require('../models/Product')
const Follow = require('../models/Follow')
const User = require('../models/User')
const Review = require('../models/Review')
const jwt = require('jsonwebtoken')
const { sendmail, link } = require('../mailer')
const { quote } = require('../delivery')
const { orderFields, idof, outOrder, notify, ratingof } = require('../helpers')

const allowed = {
  placed: { packed: ['farmer', 'admin'], cancelled: ['customer', 'admin'] },
  packed: { out_for_delivery: ['rider', 'admin'] },
  out_for_delivery: { delivered: ['rider', 'admin'] },
}
const words = {
  packed: 'is packed',
  out_for_delivery: 'is out for delivery',
  delivered: 'was delivered',
  cancelled: 'was cancelled',
}
const STATUS_NAMES = {
  placed: 'Placed',
  packed: 'Packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY = 24 * 60 * 60 * 1000

function outOrders(list) {
  const out = []
  for (let i = 0; i < list.length; i++) {
    out.push(outOrder(list[i]))
  }
  return out
}

async function placeOrder(req, res, next) {
  try {
    const items = req.body.items
    const address = req.body.address
    const phone = req.body.phone
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' })
    }
    if (!address || !phone) {
      return res.status(400).json({ message: 'Address and phone are required' })
    }

    const groups = {}
    for (let i = 0; i < items.length; i++) {
      const p = await Product.findById(items[i].product)
      const qty = Number(items[i].qty)
      if (!p || !p.active || p.hidden) {
        return res.status(400).json({ message: 'A product in your cart is no longer available' })
      }
      if (!(qty >= 1)) {
        return res.status(400).json({ message: 'Quantity must be at least 1' })
      }
      if (p.quantity < qty) {
        return res
          .status(400)
          .json({ message: 'Only ' + p.quantity + ' ' + p.unit + ' of ' + p.name + ' left' })
      }
      let image = ''
      if (p.images.length > 0) {
        image = p.images[0]
      }
      const key = String(p.farmer)
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push({ product: p._id, name: p.name, price: p.price, qty: qty, unit: p.unit, image: image })
    }

    const made = []
    const farmerIds = Object.keys(groups)
    for (let i = 0; i < farmerIds.length; i++) {
      const list = groups[farmerIds[i]]
      let total = 0
      for (let j = 0; j < list.length; j++) {
        total = total + list[j].price * list[j].qty
        await Product.updateOne({ _id: list[j].product }, { $inc: { quantity: -list[j].qty } })
      }

      const farmer = await User.findById(farmerIds[i]).select('name email farmName location')
      const pay = quote(farmer.location, address)
      const o = await Order.create({
        customer: req.user._id,
        farmer: farmerIds[i],
        items: list,
        total: total,
        deliveryFee: pay.deliveryFee,
        distanceKm: pay.distanceKm,
        address: address,
        phone: phone,
        history: [{ status: 'placed', by: req.user.name }],
      })
      await notify(farmerIds[i], 'order_status', 'New order from ' + req.user.name, '/farmer')
      await o.populate(orderFields)
      made.push(outOrder(o))

      const orderLink = link('/orders/' + o._id)
      sendmail('order_placed', req.user.email, {
        name: req.user.name,
        orderId: String(o._id),
        farmName: farmer.farmName,
        items: list,
        total: total,
        address: address,
        link: orderLink,
      })
      sendmail('new_order', farmer.email, {
        farmerName: farmer.name,
        customerName: req.user.name,
        orderId: String(o._id),
        items: list,
        total: total,
        address: address,
        phone: phone,
        link: orderLink,
      })
    }
    res.status(201).json({ orders: made })
  } catch (err) {
    next(err)
  }
}

async function myOrders(req, res, next) {
  try {
    const filter = {}
    if (req.user.role === 'customer') {
      filter.customer = req.user._id
    }
    if (req.user.role === 'farmer') {
      filter.farmer = req.user._id
    }
    if (req.user.role === 'rider') {
      filter.rider = req.user._id
    }
    const list = await Order.find(filter).sort({ createdAt: -1 }).populate(orderFields)
    res.json({ orders: outOrders(list) })
  } catch (err) {
    next(err)
  }
}

async function availableOrders(req, res, next) {
  try {
    const list = await Order.find({ status: 'packed', rider: null })
      .sort({ createdAt: -1 })
      .populate(orderFields)
    res.json({ orders: outOrders(list) })
  } catch (err) {
    next(err)
  }
}

function isParty(o, user) {
  const id = String(user._id)
  if (user.role === 'admin') {
    return true
  }
  if (idof(o.customer) === id) {
    return true
  }
  if (idof(o.farmer) === id) {
    return true
  }
  if (idof(o.rider) === id) {
    return true
  }
  return false
}

async function getOrder(req, res, next) {
  try {
    const o = await Order.findById(req.params.id).populate(orderFields)
    if (!o) {
      return res.status(404).json({ message: 'Order not found' })
    }
    if (!isParty(o, req.user)) {
      return res.status(403).json({ message: 'Not allowed' })
    }
    res.json({ order: outOrder(o) })
  } catch (err) {
    next(err)
  }
}

async function claimOrder(req, res, next) {
  try {
    const o = await Order.findOneAndUpdate(
      { _id: req.params.id, status: 'packed', rider: null },
      { rider: req.user._id },
      { new: true },
    ).populate(orderFields)
    if (!o) {
      const exists = await Order.exists({ _id: req.params.id })
      if (!exists) {
        return res.status(404).json({ message: 'Order not found' })
      }
      return res.status(400).json({ message: 'This order is not available' })
    }
    res.json({ order: outOrder(o) })
  } catch (err) {
    next(err)
  }
}

async function changeStatus(req, res, next) {
  try {
    const o = await Order.findById(req.params.id).populate(orderFields)
    if (!o) {
      return res.status(404).json({ message: 'Order not found' })
    }
    if (!isParty(o, req.user)) {
      return res.status(403).json({ message: 'Not allowed' })
    }

    const newStatus = req.body.status
    let options = allowed[o.status]
    if (!options) {
      options = {}
    }
    let roleMayDoIt = false
    if (options[newStatus] && options[newStatus].indexOf(req.user.role) !== -1) {
      roleMayDoIt = true
    }
    if (!roleMayDoIt) {
      const can = Object.keys(options)
      if (can.length === 0) {
        return res.status(400).json({ message: 'This order is finished' })
      }
      return res
        .status(400)
        .json({ message: 'From ' + o.status + ' this order can only go to ' + can.join(' or ') })
    }
    if (req.user.role === 'rider' && idof(o.rider) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Claim this order first' })
    }

    if (newStatus === 'cancelled') {
      for (let i = 0; i < o.items.length; i++) {
        await Product.updateOne({ _id: o.items[i].product }, { $inc: { quantity: o.items[i].qty } })
      }
    }
    o.status = newStatus
    o.history.push({ status: newStatus, by: req.user.name })
    await o.save()

    await notify(
      o.customer._id,
      'order_status',
      'Your order from ' + o.farmer.farmName + ' ' + words[newStatus],
      '/orders/' + o._id,
    )
    const customer = await User.findById(o.customer._id).select('name email')
    if (customer) {
      sendmail('order_status', customer.email, {
        name: customer.name,
        orderId: String(o._id),
        farmName: o.farmer.farmName,
        status: newStatus,
        link: link('/orders/' + o._id),
      })
    }
    if (newStatus === 'cancelled') {
      await notify(
        o.farmer._id,
        'order_status',
        'An order was cancelled by ' + req.user.name,
        '/orders/' + o._id,
      )
    }
    res.json({ order: outOrder(o) })
  } catch (err) {
    next(err)
  }
}

function mondayof(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function weeksfrom(query) {
  let weeks = Number(query.weeks)
  if (!weeks) {
    weeks = 8
  }
  if (weeks < 4) {
    weeks = 4
  }
  if (weeks > 26) {
    weeks = 26
  }
  return weeks
}

function dayindex(date) {
  return (date.getDay() + 6) % 7
}

function bySales(a, b) {
  return b.sales - a.sales
}

function byEarned(a, b) {
  return b.earned - a.earned
}

function topfive(map, compare) {
  const list = Object.values(map)
  list.sort(compare)
  return list.slice(0, 5)
}

function average(total, count) {
  if (count === 0) {
    return 0
  }
  return Math.round(total / count)
}

async function farmerStats(req, res, next) {
  try {
    const weeks = weeksfrom(req.query)
    const from = new Date(mondayof(new Date()).getTime() - (weeks - 1) * 7 * DAY)
    const prevFrom = new Date(from.getTime() - weeks * 7 * DAY)
    const orders = await Order.find({ farmer: req.user._id, createdAt: { $gte: prevFrom } })

    const weekly = []
    for (let i = 0; i < weeks; i++) {
      weekly.push({
        start: new Date(from.getTime() + i * 7 * DAY),
        sales: 0,
        orders: 0,
        prevSales: 0,
        prevOrders: 0,
      })
    }
    const weekdays = []
    for (let i = 0; i < DAYS.length; i++) {
      weekdays.push({ day: DAYS[i], orders: 0, sales: 0 })
    }
    const statusCounts = { placed: 0, packed: 0, out_for_delivery: 0, delivered: 0, cancelled: 0 }
    const products = {}
    let sales = 0
    let count = 0
    let itemsSold = 0
    let prevSales = 0
    let prevCount = 0

    for (let i = 0; i < orders.length; i++) {
      const o = orders[i]
      const inRange = o.createdAt >= from
      if (inRange) {
        statusCounts[o.status]++
      }
      if (o.status === 'cancelled') {
        continue
      }

      if (!inRange) {
        prevSales = prevSales + o.total
        prevCount++
        const pw = weekly[Math.floor((o.createdAt - prevFrom) / (7 * DAY))]
        if (pw) {
          pw.prevSales = pw.prevSales + o.total
          pw.prevOrders++
        }
        continue
      }

      sales = sales + o.total
      count++
      const wd = weekdays[dayindex(o.createdAt)]
      wd.orders++
      wd.sales = wd.sales + o.total
      const w = weekly[Math.floor((o.createdAt - from) / (7 * DAY))]
      if (w) {
        w.sales = w.sales + o.total
        w.orders++
      }
      for (let j = 0; j < o.items.length; j++) {
        const it = o.items[j]
        itemsSold = itemsSold + it.qty
        const key = String(it.product)
        if (!products[key]) {
          products[key] = { product: key, name: it.name, unit: it.unit, image: it.image, sales: 0, qty: 0 }
        }
        products[key].sales = products[key].sales + it.price * it.qty
        products[key].qty = products[key].qty + it.qty
      }
    }

    const r = await ratingof({ farmer: req.user._id })
    const ratings = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    const reviews = await Review.find({ farmer: req.user._id }).select('rating')
    for (let i = 0; i < reviews.length; i++) {
      ratings[reviews[i].rating]++
    }

    res.json({
      weeks: weeks,
      from: from,
      kpis: {
        sales: sales,
        salesPrev: prevSales,
        orders: count,
        ordersPrev: prevCount,
        avgOrder: average(sales, count),
        avgOrderPrev: average(prevSales, prevCount),
        items: itemsSold,
        rating: r.rating,
        reviewCount: r.reviewCount,
        followers: await Follow.countDocuments({ farmer: req.user._id }),
        toPack: await Order.countDocuments({ farmer: req.user._id, status: 'placed' }),
      },
      weekly: weekly,
      topProducts: topfive(products, bySales),
      statusCounts: statusCounts,
      weekdays: weekdays,
      ratings: ratings,
    })
  } catch (err) {
    next(err)
  }
}

function stepat(o, status) {
  for (let i = 0; i < o.history.length; i++) {
    if (o.history[i].status === status) {
      return new Date(o.history[i].at)
    }
  }
  return null
}

async function riderStats(req, res, next) {
  try {
    const weeks = weeksfrom(req.query)
    const from = new Date(mondayof(new Date()).getTime() - (weeks - 1) * 7 * DAY)
    const prevFrom = new Date(from.getTime() - weeks * 7 * DAY)
    const mine = await Order.find({ rider: req.user._id }).populate('farmer', 'farmName location')

    const weekly = []
    for (let i = 0; i < weeks; i++) {
      weekly.push({
        start: new Date(from.getTime() + i * 7 * DAY),
        earned: 0,
        deliveries: 0,
        km: 0,
        prevEarned: 0,
      })
    }
    const weekdays = []
    for (let i = 0; i < DAYS.length; i++) {
      weekdays.push({ day: DAYS[i], deliveries: 0, earned: 0 })
    }
    const farms = {}
    let earned = 0
    let deliveries = 0
    let km = 0
    let minutes = 0
    let timed = 0
    let prevEarned = 0
    let prevDeliveries = 0
    let pending = 0
    let onTheWay = 0

    for (let i = 0; i < mine.length; i++) {
      const doc = mine[i]
      const out = outOrder(doc)

      if (doc.status === 'packed' || doc.status === 'out_for_delivery') {
        onTheWay++
        pending = pending + out.deliveryFee
        continue
      }
      if (doc.status !== 'delivered') {
        continue
      }

      let at = stepat(doc, 'delivered')
      if (!at) {
        at = doc.updatedAt
      }
      if (at < prevFrom) {
        continue
      }
      if (at < from) {
        prevEarned = prevEarned + out.deliveryFee
        prevDeliveries++
        const pw = weekly[Math.floor((at - prevFrom) / (7 * DAY))]
        if (pw) {
          pw.prevEarned = pw.prevEarned + out.deliveryFee
        }
        continue
      }

      earned = earned + out.deliveryFee
      deliveries++
      km = km + out.distanceKm
      const left = stepat(doc, 'out_for_delivery')
      if (left && at > left) {
        minutes = minutes + (at - left) / 60000
        timed++
      }
      const w = weekly[Math.floor((at - from) / (7 * DAY))]
      if (w) {
        w.earned = w.earned + out.deliveryFee
        w.deliveries++
        w.km = w.km + out.distanceKm
      }
      const wd = weekdays[dayindex(at)]
      wd.deliveries++
      wd.earned = wd.earned + out.deliveryFee

      let key = 'none'
      let farmName = 'Removed farm'
      let location = ''
      if (out.farmer) {
        key = out.farmer.id
        farmName = out.farmer.farmName
        location = out.farmer.location
      }
      if (!farms[key]) {
        farms[key] = { farmer: key, farmName: farmName, location: location, deliveries: 0, earned: 0 }
      }
      farms[key].deliveries++
      farms[key].earned = farms[key].earned + out.deliveryFee
    }

    const open = await Order.find({ status: 'packed', rider: null }).populate('farmer', 'farmName location')
    let openEarnings = 0
    for (let i = 0; i < open.length; i++) {
      openEarnings = openEarnings + outOrder(open[i]).deliveryFee
    }

    let avgMinutes = null
    if (timed > 0) {
      avgMinutes = Math.round(minutes / timed)
    }

    res.json({
      weeks: weeks,
      from: from,
      kpis: {
        earned: earned,
        earnedPrev: prevEarned,
        deliveries: deliveries,
        deliveriesPrev: prevDeliveries,
        avgFee: average(earned, deliveries),
        km: km,
        avgMinutes: avgMinutes,
        onTheWay: onTheWay,
        pending: pending,
        available: open.length,
        availableEarnings: openEarnings,
      },
      weekly: weekly,
      weekdays: weekdays,
      topFarms: topfive(farms, byEarned),
      rule: { base: 100, perKm: 15, max: 1500 },
    })
  } catch (err) {
    next(err)
  }
}

function money(n) {
  return 'Rs ' + Math.round(Number(n) || 0).toLocaleString('en-US')
}

function datetext(d) {
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function receiptLink(req, res, next) {
  try {
    const o = await Order.findById(req.params.id).populate(orderFields)
    if (!o) {
      return res.status(404).json({ message: 'Order not found' })
    }
    if (!isParty(o, req.user)) {
      return res.status(403).json({ message: 'Not allowed' })
    }
    const t = jwt.sign({ purpose: 'receipt', order: String(o._id) }, process.env.JWT_SECRET, {
      expiresIn: '10m',
    })
    res.json({ url: '/api/orders/' + o._id + '/receipt?t=' + t })
  } catch (err) {
    next(err)
  }
}

async function receipt(req, res, next) {
  try {
    let data = null
    try {
      data = jwt.verify(String(req.query.t || ''), process.env.JWT_SECRET)
    } catch (err) {
      data = null
    }
    if (!data || data.purpose !== 'receipt' || data.order !== req.params.id) {
      return res
        .status(403)
        .send('This receipt link has expired. Open the order again and press Print receipt.')
    }
    const o = await Order.findById(req.params.id).populate(orderFields)
    if (!o) {
      return res.status(404).send('Order not found')
    }
    let status = STATUS_NAMES[o.status]
    if (!status) {
      status = o.status
    }
    res.render('receipt', {
      order: outOrder(o),
      number: '#' + String(o._id).slice(-6).toUpperCase(),
      status: status,
      placed: datetext(o.createdAt),
      printed: datetext(new Date()),
      money: money,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  placeOrder,
  myOrders,
  availableOrders,
  getOrder,
  claimOrder,
  changeStatus,
  farmerStats,
  riderStats,
  receiptLink,
  receipt,
}
