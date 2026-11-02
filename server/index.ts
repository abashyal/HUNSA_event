import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { fileURLToPath } from 'url'
import { getState, setState } from './eventStore.js'
import { registerHandlers } from './socketHandlers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' }
})

app.use(cors())
app.use(express.json())

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '../uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

// Serve uploaded audio files
app.use('/uploads', express.static(uploadsDir))

// Multer storage
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}${ext}`)
  },
})
const upload = multer({ storage })

// Upload endpoint
app.post('/api/upload', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  res.json({ filename: req.file.filename })
})

// State endpoint (HTTP fallback)
app.get('/api/state', (_req, res) => {
  res.json(getState())
})

// Serve React app in production
const distPath = path.join(__dirname, '../dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

// Socket.IO
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)
  // Send current state to newly connected client
  socket.emit('state:full', getState())
  registerHandlers(io, socket)
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

const PORT = 3001
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\nHUNSA Stage Manager`)
  console.log(`Server running on port ${PORT}`)

  // Find local network IP
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`\nLocal network URL: http://${iface.address}:${PORT}`)
        console.log(`Share this URL with phones on the same WiFi network\n`)
      }
    }
  }
})
