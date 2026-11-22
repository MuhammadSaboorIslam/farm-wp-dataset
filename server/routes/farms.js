const express = require('express')
const c = require('../controllers/farmController')
const { auth, maybeAuth, allow } = require('../middleware')

const router = express.Router()
router.get('/', maybeAuth, c.listFarms)
router.get('/cities', c.cities)
router.get('/following', auth, allow('customer'), c.following)
router.get('/feed', auth, allow('customer'), c.feed)
router.get('/:id', maybeAuth, c.getFarm)
router.post('/:id/follow', auth, allow('customer'), c.follow)
router.delete('/:id/follow', auth, allow('customer'), c.unfollow)
module.exports = router
