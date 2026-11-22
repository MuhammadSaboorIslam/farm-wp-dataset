const express = require('express')
const c = require('../controllers/notificationController')
const { auth } = require('../middleware')

const router = express.Router()
router.get('/', auth, c.myNotifications)
router.patch('/read', auth, c.markRead)
module.exports = router
