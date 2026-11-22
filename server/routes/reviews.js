const express = require('express')
const c = require('../controllers/reviewController')
const { auth, allow } = require('../middleware')

const router = express.Router()
router.get('/', c.listReviews)
router.post('/', auth, allow('customer'), c.addReview)
module.exports = router
