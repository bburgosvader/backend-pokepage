import express from 'express'
import { randomBytes, randomUUID, scrypt as derive, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import jwt from 'jsonwebtoken'
import mongoose, { Schema, model } from 'mongoose'
import { config } from '../config.js'
import { CardModel } from '../models/card.model.js'
import { products } from '../originalCards.js'
import { users as initialUsers } from '../repositories/usersRepository.js'

const router = express.Router()
const scrypt = promisify(derive)
const Account = model('StoreAccount', new Schema({
  email: {type: String, unique: true, required: true}, nombre: {type: String, required: true},
  passwordHash: {type: String, required: true}, rol: {type: String, default: 'user'},
  deleted: {type: Boolean, default: false}, blocked: {type: Boolean, default: false}, version: {type: Number, default: 0}
}))
const clean = (value: unknown) => typeof value === 'string' ? value.trim() : ''
async function hash(password: string, salt = randomBytes(16).toString('hex')) {
  const key = await scrypt(password, salt, 64) as Buffer
  return salt + ':' + key.toString('hex')
}
const fail = (status: number, message: string) => Object.assign(new Error(message), {status})
const validEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
export async function initializeAccounts() {
  await Account.init()
  const seeds = initialUsers.map(user => ({email:user.email,nombre:user.nombre,password:user.contraseña,rol:user.rol}))
  const adminPassword = process.env.POKESTORE_ADMIN_PASSWORD || (process.env.NODE_ENV !== 'production' ? 'Pokemon123!' : undefined)
  if (adminPassword) seeds.push({email:'admin@pokestore.cl',nombre:'Administrador',password:adminPassword,rol:'admin'})
  if (process.env.NODE_ENV !== 'production') {
    for (const nombre of ['Ignacio','Bryan','Felipe']) seeds.push({email:nombre.toLowerCase()+'@pokestore.cl',nombre,password:'123456',rol:'user'})
  }
  for (const {password,...user} of seeds) {
    if (!await Account.exists({email:user.email})) {
      await Account.updateOne({email:user.email},{$setOnInsert:{...user,passwordHash:await hash(password)}},{upsert:true})
    }
  }
}
router.post(['/auth/registro','/auth/iniciar-sesion'], async (req,res) => {
  const email = clean(req.body?.email).toLowerCase()
  const password = req.body?.password
  if (!validEmail(email) || typeof password !== 'string' || !password || password.length > 256) throw fail(400,'Credenciales inválidas')
  let account = await Account.findOne({email})
  if (req.path.endsWith('/registro')) {
    const nombre = clean(req.body.nombre)
    if (!nombre || nombre.length > 60 || password.length < 6) throw fail(400,'Escribe un nombre y una contraseña de al menos 6 caracteres.')
    if (account || email === 'admin@pokestore.cl') throw fail(409,'El correo ya está registrado.')
    account = await Account.create({email,nombre,passwordHash:await hash(password)})
  }
  if (!account || account.deleted || account.blocked || !timingSafeEqual(Buffer.from(await hash(password,account.passwordHash.split(':')[0])),Buffer.from(account.passwordHash))) throw fail(401,'Credenciales inválidas')
  const token = jwt.sign({email,rol:account.rol,v:account.version},config.jwtSecret,{subject:String(account._id),expiresIn:'1h'})
  res.json({email,nombre:account.nombre,rol:account.rol,token})
})

const authorize = (admin: boolean): express.RequestHandler => async (req,res,next) => {
  let claims
  try { claims = jwt.verify((req.get('Authorization') || '').replace(/^Bearer /,''),config.jwtSecret) }
  catch { throw fail(401,'Inicia sesión nuevamente.') }
  if (typeof claims === 'string' || !mongoose.isObjectIdOrHexString(claims.sub)) throw fail(401,'Inicia sesión nuevamente.')
  const account = await Account.findOne({_id:claims.sub,blocked:false,deleted:false,version:claims.v})
  if (!account) throw fail(401,'Sesión inválida.')
  if (admin && account.rol !== 'admin') throw fail(403,'Acceso restringido.')
  res.locals.account = account
  next()
}
router.patch('/auth/perfil',authorize(false),async(req,res)=>{
  const nombre = clean(req.body?.nombre)
  if (!nombre || nombre.length > 60) throw fail(400,'Nombre inválido.')
  await Account.updateOne({_id:res.locals.account._id},{nombre})
  res.json({nombre})
})
router.use('/admin',authorize(true))
router.get('/admin/users',async(_req,res)=>{res.json(await Account.find({deleted:false},'email nombre blocked rol').lean())})
router.patch('/admin/users/:email',async(req,res)=>{
  if(req.params.email === res.locals.account.email || typeof req.body?.blocked !== 'boolean') throw fail(400,'Cambio inválido.')
  const result = await Account.updateOne({email:req.params.email},{$set:{blocked:req.body.blocked},$inc:{version:1}})
  if (!result.matchedCount) throw fail(404,'Usuario no encontrado.')
  res.json({ok:true})
})
router.delete('/admin/users/:email',async(req,res)=>{
  if(req.params.email === res.locals.account.email) throw fail(400,'No puedes eliminar tu propia cuenta.')
  await Account.updateOne({email:req.params.email},{$set:{deleted:true,blocked:true},$inc:{version:1}})
  res.json({ok:true})
})
function card(body: Record<string,unknown> = {}) {
  const name = clean(body.name), type = clean(body.type), price = body.price
  if (!name || name.length > 40 || !['fuego','agua','planta','electrico','psiquico','normal','lucha'].includes(type) ||
    typeof price !== 'number' || !Number.isSafeInteger(price) || price <= 0) throw fail(400,'Datos de la carta inválidos.')
  return {name,type,price,image:clean(body.image) || '/img/poke-bola.png'}
}
router.post('/admin/cards',async(req,res)=>{
  res.status(201).json(await CardModel.create({...card(req.body),id:randomUUID()}))
})
router.put('/admin/cards/:id',async(req,res)=>{
  const saved = await CardModel.findOneAndUpdate({id:req.params.id},card(req.body),{new:true})
  if(!saved) throw fail(404,'Carta no encontrada.')
  res.json(saved)
})
router.delete('/admin/cards/:id',async(req,res)=>{
  await CardModel.deleteOne({id:req.params.id})
  res.json({ok:true})
})
router.post('/admin/cards/reset',async(_req,res)=>{
  await mongoose.connection.transaction(async session=>{
    await CardModel.deleteMany({},{session})
    await CardModel.insertMany(products,{session})
  })
  res.json({ok:true})
})
const errors: express.ErrorRequestHandler = (err,_req,res,_next)=>{
  const status = err.code === 11000 ? 409 : err.status || 500
  res.status(status).json({error: status === 409 ? 'El correo ya está registrado.' : status < 500 ? err.message : 'No se pudo completar la operación.'})
}
router.use(errors)
export default router
