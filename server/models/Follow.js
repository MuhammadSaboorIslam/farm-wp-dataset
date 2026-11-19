const mongoose = require('mongoose')

const followSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

followSchema.index({ customer: 1, farmer: 1 }, { unique: true })

followSchema.index({ farmer: 1 })

module.exports = mongoose.model('Follow', followSchema)
