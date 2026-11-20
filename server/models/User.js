const mongoose = require('mongoose')
const { pointfor } = require('../cities')

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name is too long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Enter a valid email'],
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'farmer', 'rider', 'admin'], default: 'customer' },
    verified: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
    farmName: { type: String, default: '', trim: true, maxlength: [80, 'Farm name is too long'] },
    location: { type: String, default: '', trim: true, maxlength: [80, 'Location is too long'] },
    bio: { type: String, default: '', maxlength: [1000, 'About your farm is too long'] },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    farmSize: { type: Number, default: null, min: [0, 'Farm size cannot be negative'] },
    crops: { type: String, default: '' },
    vehicle: { type: String, enum: ['', 'motorbike', 'bicycle', 'rickshaw', 'car'], default: '' },
    blocked: { type: Boolean, default: false },
    emailFarmNews: { type: Boolean, default: true },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    coords: { type: pointSchema, default: undefined },
    resetTokenHash: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
  },
  { timestamps: true },
)

userSchema.index({ coords: '2dsphere' }, { sparse: true })

userSchema.pre('save', function () {
  if (this.role === 'farmer' && (this.isNew || this.isModified('location'))) {
    this.coords = pointfor(this.location) || undefined
  }
})

module.exports = mongoose.model('User', userSchema)
