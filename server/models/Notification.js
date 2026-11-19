const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['order_status', 'new_product', 'new_update'], default: 'order_status' },
    text: String,
    link: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
)

notificationSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
