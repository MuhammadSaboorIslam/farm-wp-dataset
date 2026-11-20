const User = require('../models/User')
const Order = require('../models/Order')
const Product = require('../models/Product')
const { orderFields, accountuser, outOrder, notify, farmerFields, outProducts, escaperegex } = require('../helpers')
const { sendmail, link } = require('../mailer')

async function listFarmers(req, res, next) {
  try {
    const filter = { role: 'farmer' }
    if (req.query.verified === 'false') {
      filter.verified = false
      filter.rejected = { $ne: true }
    }
    if (req.query.verified === 'true') {
      filter.verified = true
    }
    const list = await User.find(filter).select('-password').sort({ createdAt: -1 })
    res.json({ farmers: list.map(accountuser) })
  } catch (err) {
    next(err)
  }
}

async function verifyFarmer(req, res, next) {
  try {
    const f = await User.findById(req.params.id).select('-password')
    if (!f || f.role !== 'farmer') {
      return res.status(404).json({ message: 'Farmer not found' })
    }
    const approve = !!req.body.approve
    f.verified = approve
    f.rejected = !approve
    await f.save()
    await notify(
      f._id,
      'order_status',
      approve
        ? 'Your farm has been verified. You can start selling.'
        : 'Your farm verification was rejected.',
      '/farmer',
    )
    sendmail('farm_verified', f.email, {
      name: f.name,
      farmName: f.farmName,
      approved: approve,
      link: link('/farmer/products/new'),
    })
    res.json({ farmer: accountuser(f) })
  } catch (err) {
    next(err)
  }
}

async function listUsers(req, res, next) {
  try {
    const list = await User.find().select('-password').sort({ createdAt: -1 })
    res.json({ users: list.map(accountuser) })
  } catch (err) {
    next(err)
  }
}

async function listOrders(req, res, next) {
  try {
    const list = await Order.find().sort({ createdAt: -1 }).populate(orderFields)
    res.json({ orders: list.map(outOrder) })
  } catch (err) {
    next(err)
  }
}

async function blockUser(req, res, next) {
  try {
    const u = await User.findById(req.params.id).select('-password')
    if (!u) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (u.role === 'admin') {
      return res.status(400).json({ message: 'Admins cannot be blocked' })
    }
    u.blocked = !!req.body.blocked
    await u.save()
    res.json({ user: accountuser(u) })
  } catch (err) {
    next(err)
  }
}

async function listProducts(req, res, next) {
  try {
    const filter = {}
    if (req.query.q) {
      const re = new RegExp(escaperegex(String(req.query.q)), 'i')
      filter.$or = [{ name: re }, { category: re }, { location: re }]
    }
    const list = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('farmer', farmerFields)
    res.json({ products: await outProducts(list) })
  } catch (err) {
    next(err)
  }
}

async function hideProduct(req, res, next) {
  try {
    const p = await Product.findById(req.params.id).populate('farmer', farmerFields)
    if (!p) {
      return res.status(404).json({ message: 'Product not found' })
    }
    p.hidden = !!req.body.hidden
    await p.save()
    await notify(
      p.farmer._id,
      'order_status',
      p.hidden
        ? 'An admin hid your product ' + p.name + '. Contact the admin to ask why.'
        : 'Your product ' + p.name + ' is visible again.',
      '/farmer',
    )
    const out = await outProducts([p])
    res.json({ product: out[0] })
  } catch (err) {
    next(err)
  }
}

const DAY = 24 * 60 * 60 * 1000

async function stats(req, res, next) {
  try {
    const weeks = 12
    const monday = new Date()
    monday.setHours(0, 0, 0, 0)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const from = new Date(monday.getTime() - (weeks - 1) * 7 * DAY)

    const roles = { customer: 0, farmer: 0, rider: 0, admin: 0 }
    for (const r of await User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }])) roles[r._id] = r.n
    let usercount = 0
    for (const key in roles) {
      usercount += roles[key]
    }
    const weekly = []
    for (let i = 0; i < weeks; i++)
      weekly.push({ start: new Date(from.getTime() + i * 7 * DAY), sales: 0, orders: 0, signups: 0 })

    const orders = await Order.find({ createdAt: { $gte: from } }).populate('farmer', 'farmName')
    const statusCounts = { placed: 0, packed: 0, out_for_delivery: 0, delivered: 0, cancelled: 0 }
    const farms = {}
    let sales = 0
    for (const o of orders) {
      statusCounts[o.status]++
      if (o.status === 'cancelled') continue
      sales += o.total
      const w = weekly[Math.floor((o.createdAt - from) / (7 * DAY))]
      if (w) {
        w.sales += o.total
        w.orders++
      }
      const key = String(o.farmer ? o.farmer._id : '')
      if (!farms[key])
        farms[key] = {
          farmer: key,
          farmName: o.farmer ? o.farmer.farmName : 'Removed farm',
          sales: 0,
          orders: 0,
        }
      farms[key].sales += o.total
      farms[key].orders++
    }
    for (const u of await User.find({ createdAt: { $gte: from } }).select('createdAt')) {
      const w = weekly[Math.floor((u.createdAt - from) / (7 * DAY))]
      if (w) w.signups++
    }

    res.json({
      weeks: weeks,
      kpis: {
        sales: sales,
        orders: orders.length - statusCounts.cancelled,
        users: usercount,
        roles: roles,
        pendingFarms: await User.countDocuments({ role: 'farmer', verified: false, rejected: { $ne: true } }),
        blocked: await User.countDocuments({ blocked: true }),
        hiddenProducts: await Product.countDocuments({ hidden: true }),
        liveProducts: await Product.countDocuments({ active: true, hidden: { $ne: true } }),
      },
      weekly: weekly,
      statusCounts: statusCounts,
      topFarms: Object.values(farms)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5),
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listFarmers,
  verifyFarmer,
  listUsers,
  listOrders,
  blockUser,
  listProducts,
  hideProduct,
  stats,
}
