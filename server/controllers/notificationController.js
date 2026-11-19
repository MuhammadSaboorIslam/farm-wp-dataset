const Notification = require('../models/Notification')

async function myNotifications(req, res, next) {
  try {
    const list = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50)
    const unread = await Notification.countDocuments({ user: req.user._id, read: false })
    const out = list.map((n) => ({
      id: String(n._id),
      type: n.type,
      text: n.text,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt,
    }))
    res.json({ notifications: out, unread: unread })
  } catch (err) {
    next(err)
  }
}

async function markRead(req, res, next) {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

module.exports = { myNotifications, markRead }
