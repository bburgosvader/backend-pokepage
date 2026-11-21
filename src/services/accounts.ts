import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { Account } from '../models/account.model.js'
import { users as initialUsers } from '../repositories/usersRepository.js'

const deriveKey = promisify(scrypt)

export async function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const key = await deriveKey(password, salt, 64) as Buffer
  return salt + ':' + key.toString('hex')
}

export async function matchesPassword(password: string, storedHash: string) {
  const [salt] = storedHash.split(':')
  const candidate = await hashPassword(password, salt)
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(storedHash))
}

export function createSession(account: InstanceType<typeof Account>) {
  const { email, rol, nombre } = account
  const claims = { email, rol, v: account.version }
  const token = jwt.sign(claims, config.jwtSecret, { subject: String(account._id), expiresIn: '1h' })
  return { email, nombre, rol, token }
}

export async function initializeAccounts() {
  await Account.init()
  const seeds = initialUsers.map(user => ({
    email: user.email, nombre: user.nombre, password: user.contraseña, rol: user.rol
  }))
  const development = process.env.NODE_ENV !== 'production'
  const adminPassword = process.env.POKESTORE_ADMIN_PASSWORD || (development ? 'Pokemon123!' : undefined)
  if (adminPassword) {
    seeds.push({ email: 'admin@pokestore.cl', nombre: 'Administrador', password: adminPassword, rol: 'admin' })
  }
  if (development) {
    for (const nombre of ['Ignacio', 'Bryan', 'Felipe']) {
      seeds.push({ email: nombre.toLowerCase() + '@pokestore.cl', nombre, password: '123456', rol: 'user' })
    }
  }
  // Al reiniciar el servidor se conservan las cuentas existentes, incluso las bloqueadas o eliminadas.
  for (const { password, ...user } of seeds) {
    if (await Account.exists({ email: user.email })) continue
    const passwordHash = await hashPassword(password)
    await Account.updateOne({ email: user.email }, { $setOnInsert: { ...user, passwordHash } }, { upsert: true })
  }
}
