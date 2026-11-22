const express = require('express')
const c = require('../controllers/productController')
const { auth, maybeAuth, verifiedFarmer } = require('../middleware')

const router = express.Router()
router.get('/', maybeAuth, c.listProducts)
router.post('/', auth, verifiedFarmer, c.createProduct)
router.get('/:id', maybeAuth, c.getProduct)
router.put('/:id', auth, c.updateProduct)
router.delete('/:id', auth, c.deleteProduct)
module.exports = router
