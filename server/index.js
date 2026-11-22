require('dotenv').config()
const path = require('path')
const http = require('http')
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')
const { setupSocket } = require('./socket')
const { corsOptions, securityHeaders, cleanbody } = require('./security') 
const app = express()
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(securityHeaders)
app.use(cors(corsOptions))
app.use(express.json({ limit: '15mb' }))
app.use(cookieParser())
app.use(cleanbody)

app.use('/api/auth', require('./routes/auth'))
app.use('/api/products', require('./routes/products'))
app.use('/api/farms', require('./routes/farms'))
app.use('/api/updates', require('./routes/updates'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/reviews', require('./routes/reviews'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/wishlist', require('./routes/wishlist'))

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'No route for ' + req.method + ' ' + req.originalUrl })
})

app.use((err, req, res, next) => {
  if (err.name === 'CastError') {
    return res.status(404).json({ message: 'Not found' })
  }
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0]
    return res.status(400).json({ message: first ? first.message : 'Some fields are not valid' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Photos are too big, try smaller ones' })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Bad request body' })
  }
  console.log(err.message)
  res.status(500).json({ message: 'Something went wrong' })
})

const PORT = process.env.PORT || 4000
const server = http.createServer(app)
setupSocket(server)

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log('server on http://localhost:' + PORT)
    })
  })
  .catch((err) => {
    console.log('mongo error: ' + err.message)
  })
