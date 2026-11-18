const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    qty: Number,
    unit: String,
    image: String,
  },
  { _id: false },
)

const historySchema = new mongoose.Schema(
  {
    status: String,
    at: { type: Date, default: Date.now },
    by: String,
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: [itemSchema],
    total: Number,
    address: String,
    phone: String,
    deliveryFee: { type: Number, default: null },
    distanceKm: { type: Number, default: null },
    status: {
      type: String,
      enum: ['placed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed',
    },
    history: [historySchema],
  },
  { timestamps: true },
)

orderSchema.index({ customer: 1, createdAt: -1 })
orderSchema.index({ farmer: 1, createdAt: -1 })
orderSchema.index({ rider: 1, status: 1 })
orderSchema.index({ status: 1, rider: 1 })

module.exports = mongoose.model('Order', orderSchema)
