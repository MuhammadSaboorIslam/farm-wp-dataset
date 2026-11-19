const Update = require('../models/Update')
const { farmerFields, outUpdate, notifyFollowers } = require('../helpers')

async function listUpdates(req, res, next) {
  try {
    const filter = {}
    if (req.query.farmer === 'me') {
      if (!req.user) {
        return res.json({ updates: [] })
      }
      filter.farmer = req.user._id
    } else if (req.query.farmer) {
      filter.farmer = req.query.farmer
    }
    const list = await Update.find(filter).sort({ createdAt: -1 }).populate('farmer', farmerFields)
    res.json({ updates: list.map(outUpdate) })
  } catch (err) {
    next(err)
  }
}

async function createUpdate(req, res, next) {
  try {
    if (!req.body.title) {
      return res.status(400).json({ message: 'Title is required' })
    }
    const u = await Update.create({
      farmer: req.user._id,
      title: req.body.title,
      body: req.body.body || '',
      images: req.body.images || [],
    })
    await notifyFollowers(
      req.user._id,
      'new_update',
      req.user.farmName + ' posted: ' + u.title,
      '/farms/' + req.user._id,
      { farmName: req.user.farmName, title: u.title, body: u.body },
    )
    await u.populate('farmer', farmerFields)
    res.status(201).json({ update: outUpdate(u) })
  } catch (err) {
    next(err)
  }
}

module.exports = { listUpdates, createUpdate }
