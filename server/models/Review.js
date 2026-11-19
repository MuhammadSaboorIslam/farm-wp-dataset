const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '', maxlength: [1000, 'Review is too long'] },
  },
  { timestamps: true },
)

reviewSchema.index({ product: 1, createdAt: -1 })
reviewSchema.index({ farmer: 1 })

module.exports = mongoose.model('Review', reviewSchema)
