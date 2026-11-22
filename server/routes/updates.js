const express = require('express')
const c = require('../controllers/updateController')
const { auth, maybeAuth, verifiedFarmer } = require('../middleware')

const router = express.Router()
router.get('/', maybeAuth, c.listUpdates)
router.post('/', auth, verifiedFarmer, c.createUpdate)
module.exports = router
