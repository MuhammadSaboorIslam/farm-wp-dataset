const User = require('../models/User')
const Product = require('../models/Product')
const { farmerFields, outProducts } = require('../helpers')

function ids(user) {
  return user.wishlist.map(String)
}

async function myWishlist(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
    const products = await Product.find({ _id: { $in: user.wishlist } }).populate(
      'farmer',
      farmerFields + ' blocked',
    )
    const order = ids(user).reverse()
    products.sort((a, b) => order.indexOf(String(a._id)) - order.indexOf(String(b._id)))
    const out = await outProducts(products)
    for (let i = 0; i < out.length; i++) {
      out[i].available =
        products[i].active && !products[i].hidden && !products[i].farmer.blocked && products[i].quantity > 0
    }
    res.json({ products: out, ids: ids(user) })
  } catch (err) {
    next(err)
  }
}

async function save(req, res, next) {
  try {
    const p = await Product.findById(req.params.productId)
    if (!p || p.hidden) {
      return res.status(404).json({ message: 'Product not found' })
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: p._id } }, { new: true })
    res.json({ ids: ids(user) })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { wishlist: req.params.productId } },
      { new: true },
    )
    res.json({ ids: ids(user) })
  } catch (err) {
    next(err)
  }
}

module.exports = { myWishlist, save, remove }
