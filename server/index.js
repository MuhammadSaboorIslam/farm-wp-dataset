require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const authRoutes = require('./routes/auth')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})
app.use('/api/auth', authRoutes)

app.use((err, req, res, next) => {
  console.log(err.message)
  res.status(500).json({ message: 'Something went wrong' })
})

const PORT = process.env.PORT || 4000

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log('server on http://localhost:' + PORT)
    })
  })
  .catch((err) => {
    console.log('mongo error: ' + err.message)
  })
