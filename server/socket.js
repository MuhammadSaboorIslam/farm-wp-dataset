const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { allowedOrigins } = require('./security')

let io = null

function setupSocket(server) {
  io = new Server(server, { cors: { origin: allowedOrigins() } })
  io.use((socket, next) => {
    try {
      const data = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET)
      socket.userId = String(data.id)
      next()
    } catch (err) {
      next(new Error('Please login'))
    }
  })
  io.on('connection', (socket) => {
    socket.join(socket.userId)
  })
}

function sendto(userId, event, data) {
  if (io) {
    io.to(String(userId)).emit(event, data)
  }
}

module.exports = { setupSocket, sendto }
