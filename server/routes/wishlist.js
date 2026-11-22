const express = require('express')
const c = require('../controllers/wishlistController')
const { auth, allow } = require('../middleware')

const router = express.Router()
router.use(auth, allow('customer'))
router.get('/', c.myWishlist)
router.post('/:productId', c.save)
router.delete('/:productId', c.remove)
module.exports = router
