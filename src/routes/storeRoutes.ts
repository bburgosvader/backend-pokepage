import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { config } from '../config.js'
import { Account } from '../models/account.model.js'
import { createSession, hashPassword, matchesPassword } from '../services/accounts.js'
import { adminCardRoutes } from './cardRoutes.js'

const router = express.Router()

// Ambas operaciones aceptan el correo sin distinguir mayúsculas.
function credentials(body: Record<string, unknown> = {}) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = body.password
  const validEmail = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!validEmail || typeof password !== 'string' || !password || password.length > 256) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 400 })
  }
  return { email, password }
}

router.post('/auth/registro', async (req, res) => {
  const { email, password } = credentials(req.body)
  const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : ''
  if (!nombre || nombre.length > 60 || password.length < 6) {
    res.status(400).json({ error: 'Escribe un nombre y una contraseña de al menos 6 caracteres.' })
    return
  }
  if (email === 'admin@pokestore.cl' || await Account.exists({ email })) {
    res.status(409).json({ error: 'El correo ya está registrado.' })
    return
  }
  const passwordHash = await hashPassword(password)
  const account = await Account.create({ email, nombre, passwordHash })
  res.json(createSession(account))
})

router.post('/auth/iniciar-sesion', async (req, res) => {
  const { email, password } = credentials(req.body)
  const account = await Account.findOne({ email, deleted: false, blocked: false })
  if (!account || !await matchesPassword(password, account.passwordHash)) {
    res.status(401).json({ error: 'Credenciales inválidas' })
    return
  }
  res.json(createSession(account))
})

const requireSession: express.RequestHandler = async (req, res, next) => {
  const token = (req.get('Authorization') || '').replace(/^Bearer /, '')
  let claims
  try {
    claims = jwt.verify(token, config.jwtSecret)
  } catch {
    res.status(401).json({ error: 'Inicia sesión nuevamente.' })
    return
  }
  if (typeof claims === 'string' || !mongoose.isObjectIdOrHexString(claims.sub)) {
    res.status(401).json({ error: 'Inicia sesión nuevamente.' })
    return
  }
  // La firma acredita el token. La consulta confirma que la cuenta sigue activa.
  const account = await Account.findOne({ _id: claims.sub, blocked: false, deleted: false, version: claims.v })
  if (!account) {
    res.status(401).json({ error: 'Sesión inválida.' })
    return
  }
  res.locals.account = account
  next()
}

router.patch('/auth/perfil', requireSession, async (req, res) => {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : ''
  if (!nombre || nombre.length > 60) {
    res.status(400).json({ error: 'Nombre inválido.' })
    return
  }
  await Account.updateOne({ _id: res.locals.account._id }, { nombre })
  res.json({ nombre })
})

router.use('/admin', requireSession, (_req, res, next) => {
  if (res.locals.account.rol !== 'admin') {
    res.status(403).json({ error: 'Acceso restringido.' })
    return
  }
  next()
})
router.use('/admin/cards', adminCardRoutes)
router.get('/admin/users', async (_req, res) => {
  const users = await Account.find({ deleted: false }, 'email nombre blocked rol').lean()
  res.json(users)
})
router.patch('/admin/users/:email', async (req, res) => {
  const { email } = req.params
  const blocked = req.body?.blocked
  if (email === res.locals.account.email || typeof blocked !== 'boolean') {
    res.status(400).json({ error: 'Cambio inválido.' })
    return
  }
  const result = await Account.updateOne({ email }, { $set: { blocked }, $inc: { version: 1 } })
  if (!result.matchedCount) {
    res.status(404).json({ error: 'Usuario no encontrado.' })
    return
  }
  res.json({ ok: true })
})
router.delete('/admin/users/:email', async (req, res) => {
  const { email } = req.params
  if (email === res.locals.account.email) {
    res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' })
    return
  }
  // La eliminación lógica impide que la inicialización vuelva a crear esta cuenta.
  await Account.updateOne({ email }, { $set: { deleted: true, blocked: true }, $inc: { version: 1 } })
  res.json({ ok: true })
})

const handleError: express.ErrorRequestHandler = (error, _req, res, _next) => {
  if (error.code === 11000) {
    res.status(409).json({ error: 'El correo ya está registrado.' })
    return
  }
  const status = error.status || 500
  const message = status < 500 ? error.message : 'No se pudo completar la operación.'
  res.status(status).json({ error: message })
}
router.use(handleError)
export default router
