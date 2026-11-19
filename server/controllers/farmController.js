const User = require('../models/User')
const Product = require('../models/Product')
const Update = require('../models/Update')
const Follow = require('../models/Follow')
const { farmerFields, publicUser, ratingof, outProducts, outUpdate, escaperegex } = require('../helpers')
const { CITIES, findcity } = require('../cities')
const { straightkm } = require('../delivery')

async function findfarm(id) {
  const f = await User.findById(id).select('-password')
  if (!f || f.role !== 'farmer' || f.blocked) {
    return null
  }
  return f
}

async function getFarm(req, res, next) {
  try {
    const f = await findfarm(req.params.id)
    if (!f) {
      return res.status(404).json({ message: 'Farm not found' })
    }
    const products = await Product.find({ farmer: f._id, active: true, hidden: { $ne: true } })
      .sort({ createdAt: -1 })
      .populate('farmer', farmerFields)
    const updates = await Update.find({ farmer: f._id })
      .sort({ createdAt: -1 })
      .populate('farmer', farmerFields)
    const followers = await Follow.countDocuments({ farmer: f._id })
    let following = false
    if (req.user) {
      following = !!(await Follow.findOne({ customer: req.user._id, farmer: f._id }))
    }
    const r = await ratingof({ farmer: f._id })
    res.json({
      farm: publicUser(f),
      products: await outProducts(products),
      updates: updates.map(outUpdate),
      followers: followers,
      following: following,
      rating: r.rating,
      reviewCount: r.reviewCount,
    })
  } catch (err) {
    next(err)
  }
}

async function following(req, res, next) {
  try {
    const follows = await Follow.find({ customer: req.user._id }).populate('farmer', '-password')
    const list = []
    for (let i = 0; i < follows.length; i++) {
      const f = follows[i].farmer
      if (!f || f.blocked) continue
      const latest = await Update.findOne({ farmer: f._id })
        .sort({ createdAt: -1 })
        .populate('farmer', farmerFields)
      const productCount = await Product.countDocuments({
        farmer: f._id,
        active: true,
        hidden: { $ne: true },
      })
      list.push({
        farm: publicUser(f),
        latestUpdate: latest ? outUpdate(latest) : null,
        productCount: productCount,
      })
    }
    res.json({ farms: list })
  } catch (err) {
    next(err)
  }
}

async function follow(req, res, next) {
  try {
    const f = await findfarm(req.params.id)
    if (!f) {
      return res.status(404).json({ message: 'Farm not found' })
    }
    await Follow.updateOne({ customer: req.user._id, farmer: f._id }, {}, { upsert: true })
    res.json({ following: true, followers: await Follow.countDocuments({ farmer: f._id }) })
  } catch (err) {
    next(err)
  }
}

async function unfollow(req, res, next) {
  try {
    const f = await findfarm(req.params.id)
    if (!f) {
      return res.status(404).json({ message: 'Farm not found' })
    }
    await Follow.deleteOne({ customer: req.user._id, farmer: f._id })
    res.json({ following: false, followers: await Follow.countDocuments({ farmer: f._id }) })
  } catch (err) {
    next(err)
  }
}

async function listFarms(req, res, next) {
  try {
    const match = { role: 'farmer', verified: true, blocked: { $ne: true } }
    if (req.query.q) {
      const re = new RegExp(escaperegex(String(req.query.q)), 'i')
      match.$or = [{ farmName: re }, { location: re }, { crops: re }, { name: re }]
    }
    let origin = null
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    if (
      req.query.lat !== undefined &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      origin = [lat, lng]
    } else if (req.query.city) {
      origin = CITIES[findcity(req.query.city)] || null
    }

    const farms = await User.find(match).select('-password').sort({ createdAt: 1 }).lean()
    if (origin) {
      for (const f of farms) {
        const city = findcity(f.location)
        f.distance = city ? straightkm(origin, CITIES[city]) : null
      }
      farms.sort((a, b) => (a.distance === null ? Infinity : a.distance) - (b.distance === null ? Infinity : b.distance))
    }

    const following = new Set()
    if (req.user && req.user.role === 'customer') {
      const mine = await Follow.find({ customer: req.user._id }).select('farmer')
      mine.forEach((x) => following.add(String(x.farmer)))
    }
    const out = []
    for (const f of farms) {
      const live = { farmer: f._id, active: true, hidden: { $ne: true } }
      const cover = await Product.findOne(live).sort({ createdAt: -1 }).select('images')
      const r = await ratingof({ farmer: f._id })
      out.push({
        farm: publicUser(f),
        distanceKm: typeof f.distance === 'number' ? Math.round(f.distance) : null,
        coverImage: cover && cover.images[0] ? cover.images[0] : null,
        productCount: await Product.countDocuments(live),
        followers: await Follow.countDocuments({ farmer: f._id }),
        rating: r.rating,
        reviewCount: r.reviewCount,
        following: following.has(String(f._id)),
      })
    }
    res.json({ farms: out, near: origin ? req.query.city || 'your location' : null })
  } catch (err) {
    next(err)
  }
}

function cities(req, res) {
  res.json({ cities: Object.keys(CITIES).sort() })
}

async function feed(req, res, next) {
  try {
    const follows = await Follow.find({ customer: req.user._id }).populate('farmer', 'blocked')
    const farmIds = follows.filter((f) => f.farmer && !f.farmer.blocked).map((f) => f.farmer._id)
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const updates = await Update.find({ farmer: { $in: farmIds }, createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('farmer', farmerFields)
    const products = await Product.find({
      farmer: { $in: farmIds },
      createdAt: { $gte: since },
      active: true,
      hidden: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('farmer', farmerFields)
    const items = updates.map((u) => ({ kind: 'update', at: u.createdAt, update: outUpdate(u) }))
    for (const p of await outProducts(products)) items.push({ kind: 'product', at: p.createdAt, product: p })
    items.sort((a, b) => new Date(b.at) - new Date(a.at))
    res.json({ items: items.slice(0, 30) })
  } catch (err) {
    next(err)
  }
}

module.exports = { getFarm, following, follow, unfollow, listFarms, cities, feed }
