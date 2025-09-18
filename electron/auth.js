// electron/auth.js
// Lightweight Express auth server for demo.
// Routes:
// POST /api/login  { username, password } => { token, user }
// GET  /api/me     Authorization: Bearer <token> => { user }

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const DEFAULT_PORT = 34987
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret' // production: set env var

// In-memory demo user store. Replace with your DB in production.
// Password for demo user is "password".
const users = [
  {
    id: 1,
    username: 'demo',
    // hash created at runtime so no precomputed hash is required.
    passwordHash: bcrypt.hashSync('password', 10),
    displayName: 'Demo User'
  }
]

// Find user helper
function findUserByUsername(username) {
  return users.find(u => u.username === username)
}

function startAuthServer(port = DEFAULT_PORT) {
  const app = express()
  app.use(cors({ origin: true })) // allow renderer dev server and packaged app to call
  app.use(bodyParser.json())

  // Login route
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {}
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' })
    }
    const user = findUserByUsername(username)
    if (!user) return res.status(401).json({ error: 'invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'invalid credentials' })

    const payload = { id: user.id, username: user.username }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' })

    res.json({ token, user: { id: user.id, username: user.username, displayName: user.displayName } })
  })

  // Middleware to protect routes
  function authMiddleware(req, res, next) {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'missing authorization' })
    const m = auth.match(/^Bearer (.+)$/)
    if (!m) return res.status(401).json({ error: 'invalid authorization format' })
    const token = m[1]
    try {
      const data = jwt.verify(token, JWT_SECRET)
      req.user = data
      next()
    } catch (e) {
      return res.status(401).json({ error: 'invalid token' })
    }
  }

  // Example protected route: get current user
  app.get('/api/me', authMiddleware, (req, res) => {
    const u = findUserByUsername(req.user.username)
    if (!u) return res.status(404).json({ error: 'user not found' })
    res.json({ user: { id: u.id, username: u.username, displayName: u.displayName } })
  })

  const server = app.listen(port, () => {
    console.log(`[auth] started on http://localhost:${port}`)
  })

  return { app, server, port }
}

module.exports = { startAuthServer }