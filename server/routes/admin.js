const express = require('express')
const c = require('../controllers/adminController')
const { auth, allow } = require('../middleware')

const router = express.Router()

router.use(auth, allow('admin'))
router.get('/farmers', c.listFarmers)
router.patch('/farmers/:id/verify', c.verifyFarmer)
router.get('/users', c.listUsers)
router.get('/orders', c.listOrders)
router.get('/stats', c.stats)
router.patch('/users/:id/block', c.blockUser)
router.get('/products', c.listProducts)
router.patch('/products/:id/hide', c.hideProduct)

module.exports = router
