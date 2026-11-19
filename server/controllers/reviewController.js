const Review = require('../models/Review')
const Order = require('../models/Order')
const { outReview } = require('../helpers')

async function listReviews(req, res, next) {
  try {
    const filter = {}
    if (req.query.product) {
      filter.product = req.query.product
    }
    const list = await Review.find(filter).sort({ createdAt: -1 }).populate('customer', 'name')
    res.json({ reviews: list.map(outReview) })
  } catch (err) {
    next(err)
  }
}

async function addReview(req, res, next) {
  try {
    const { order, product, comment } = req.body
    const o = order ? await Order.findById(order) : null
    if (!o || String(o.customer) !== String(req.user._id) || o.status !== 'delivered') {
      return res.status(400).json({ message: 'You can only review products from a delivered order' })
    }
    let inOrder = false
    for (let i = 0; i < o.items.length; i++) {
      if (String(o.items[i].product) === String(product)) inOrder = true
    }
    if (!inOrder) {
      return res.status(400).json({ message: 'That product is not in this order' })
    }
    const already = await Review.findOne({ customer: req.user._id, product: product, order: o._id })
    if (already) {
      return res.status(400).json({ message: 'You already reviewed this product' })
    }
    const rating = Number(req.body.rating)
    if (!(rating >= 1 && rating <= 5)) {
      return res.status(400).json({ message: 'Rating must be 1 to 5' })
    }
    const r = await Review.create({
      customer: req.user._id,
      product: product,
      farmer: o.farmer,
      order: o._id,
      rating: rating,
      comment: comment || '',
    })
    await r.populate('customer', 'name')
    res.status(201).json({ review: outReview(r) })
  } catch (err) {
    next(err)
  }
}

module.exports = { listReviews, addReview }
