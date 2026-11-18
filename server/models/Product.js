const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name is too long'],
    },
    description: { type: String, default: '', maxlength: [1000, 'Description is too long'] },
    category: {
      type: String,
      default: 'Vegetables',
      enum: {
        values: ['Vegetables', 'Fruits', 'Dairy & Eggs', 'Grains', 'Honey', 'Herbs', 'Meat & Poultry'],
        message: 'Pick a category from the list',
      },
    },
    price: { type: Number, required: [true, 'Price is required'], min: [1, 'Price must be at least Rs 1'] },
    quantity: { type: Number, default: 0, min: [0, 'Quantity cannot be negative'] },
    unit: {
      type: String,
      default: 'kg',
      enum: { values: ['kg', 'dozen', 'litre', 'bunch', 'piece'], message: 'Pick a unit from the list' },
    },
    images: [String],
    location: { type: String, default: '' },
    active: { type: Boolean, default: true },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true },
)

productSchema.index({ active: 1, hidden: 1, createdAt: -1 })
productSchema.index({ farmer: 1, createdAt: -1 })

module.exports = mongoose.model('Product', productSchema)
