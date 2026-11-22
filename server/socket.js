const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { allowedOrigins } = require('./security')

let io = null

function readcookie(header, name) {
  const parts = String(header || '').split(';')
  for (let i = 0; i < parts.length; i++) {
    const pair = parts[i].trim().split('=')
    if (pair[0] === name) {
      return decodeURIComponent(pair[1] || '')
    }
  }
  return ''
}

function setupSocket(server) {
  io = new Server(server, { cors: { origin: allowedOrigins() } })
  io.use((socket, next) => {
    try {
      const token = readcookie(socket.handshake.headers.cookie, 'token')
      const data = jwt.verify(token, process.env.JWT_SECRET)
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
