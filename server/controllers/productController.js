const Product = require('../models/Product')
const Review = require('../models/Review')
const { farmerFields, outProducts, outProduct, outReview, notifyFollowers, escaperegex, blockedids } = require('../helpers')

async function listProducts(req, res, next) {
  try {
    const q = req.query
    const filter = {}
    if (q.farmer) {
      if (q.farmer === 'me' && !req.user) {
        return res.json({ products: [], page: { number: 0, totalPages: 0, totalElements: 0 } })
      }
      filter.farmer = q.farmer === 'me' ? req.user._id : q.farmer
      if (q.farmer !== 'me') filter.hidden = { $ne: true }
    } else {
      filter.active = true
      filter.hidden = { $ne: true }
      filter.farmer = { $nin: await blockedids() }
    }
    if (q.q) {
      const re = new RegExp(escaperegex(q.q), 'i')
      filter.$or = [{ name: re }, { description: re }]
    }
    if (q.category) {
      filter.category = q.category
    }
    if (q.minPrice || q.maxPrice) {
      filter.price = {}
      if (q.minPrice) filter.price.$gte = Number(q.minPrice)
      if (q.maxPrice) filter.price.$lte = Number(q.maxPrice)
    }
    if (q.location) {
      filter.location = new RegExp(escaperegex(q.location), 'i')
    }

    let sort = { createdAt: -1 }
    if (q.sort === 'price,asc') sort = { price: 1 }
    if (q.sort === 'price,desc') sort = { price: -1 }
    if (q.sort === 'name,asc') sort = { name: 1 }

    const size = Number(q.size || 12)
    const page = Number(q.page || 0)
    const total = await Product.countDocuments(filter)
    const list = await Product.find(filter)
      .sort(sort)
      .skip(page * size)
      .limit(size)
      .populate('farmer', farmerFields)
    res.json({
      products: await outProducts(list),
      page: { number: page, totalPages: Math.ceil(total / size), totalElements: total },
    })
  } catch (err) {
    next(err)
  }
}

async function getProduct(req, res, next) {
  try {
    const p = await Product.findById(req.params.id).populate('farmer', farmerFields + ' blocked')
    const mine = p && req.user && (String(p.farmer._id) === String(req.user._id) || req.user.role === 'admin')
    if (!p || ((p.hidden || p.farmer.blocked) && !mine)) {
      return res.status(404).json({ message: 'Product not found' })
    }
    const reviews = await Review.find({ product: p._id }).sort({ createdAt: -1 }).populate('customer', 'name')
    res.json({ product: await outProduct(p), reviews: reviews.map(outReview) })
  } catch (err) {
    next(err)
  }
}

async function createProduct(req, res, next) {
  try {
    const body = req.body
    if (!body.name || !body.price) {
      return res.status(400).json({ message: 'Name and price are required' })
    }
    const p = await Product.create({
      farmer: req.user._id,
      name: body.name,
      description: body.description || '',
      category: body.category || 'Vegetables',
      price: Number(body.price),
      quantity: Number(body.quantity || 0),
      unit: body.unit || 'kg',
      images: body.images || [],
      location: req.user.location || '',
    })
    await notifyFollowers(
      req.user._id,
      'new_product',
      req.user.farmName + ' added ' + p.name,
      '/products/' + p._id,
      {
        farmName: req.user.farmName,
        productName: p.name,
        description: p.description,
        price: p.price,
        unit: p.unit,
      },
    )
    await p.populate('farmer', farmerFields)
    res.status(201).json({ product: await outProduct(p) })
  } catch (err) {
    next(err)
  }
}

async function ownproduct(req, res) {
  const p = await Product.findById(req.params.id)
  if (!p) {
    res.status(404).json({ message: 'Product not found' })
    return null
  }
  if (String(p.farmer) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403).json({ message: 'Not allowed' })
    return null
  }
  return p
}

async function updateProduct(req, res, next) {
  try {
    const p = await ownproduct(req, res)
    if (!p) return
    const keys = ['name', 'description', 'category', 'price', 'quantity', 'unit', 'images', 'active']
    for (let i = 0; i < keys.length; i++) {
      if (req.body[keys[i]] !== undefined) {
        p[keys[i]] = req.body[keys[i]]
      }
    }
    p.price = Number(p.price)
    p.quantity = Number(p.quantity)
    await p.save()
    await p.populate('farmer', farmerFields)
    res.json({ product: await outProduct(p) })
  } catch (err) {
    next(err)
  }
}

async function deleteProduct(req, res, next) {
  try {
    const p = await ownproduct(req, res)
    if (!p) return
    await p.deleteOne()
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct }
