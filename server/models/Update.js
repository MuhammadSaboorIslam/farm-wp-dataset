const mongoose = require('mongoose')

const updateSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title is too long'],
    },
    body: { type: String, default: '', maxlength: [2000, 'Update is too long'] },
    images: [String],
  },
  { timestamps: true },
)

updateSchema.index({ farmer: 1, createdAt: -1 })

module.exports = mongoose.model('Update', updateSchema)
