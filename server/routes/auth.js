const express = require('express')
const { register, login, me, updateMe, changePassword, forgotPassword, resetPassword, updateSettings } = require('../controllers/authController')
const { auth } = require('../middleware')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/forgot', forgotPassword)
router.post('/reset', resetPassword)
router.get('/me', auth, me)
router.put('/me', auth, updateMe)
router.put('/password', auth, changePassword)
router.put('/settings', auth, updateSettings)

module.exports = router
