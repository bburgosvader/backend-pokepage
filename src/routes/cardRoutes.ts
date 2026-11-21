import express from 'express'
import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import { CardModel } from '../models/card.model.js'
import { products } from '../originalCards.js'

const publicRoutes = express.Router()
export const adminCardRoutes = express.Router()

publicRoutes.get('/', async (_req, res) => {
  const cards = await CardModel.find().lean()
  res.json(cards)
})

publicRoutes.get('/:id', async (req, res) => {
  const card = await CardModel.findOne({ id: req.params.id }).lean()
  if (!card) {
    res.status(404).json({ error: 'Tarjeta no encontrada' })
    return
  }
  res.json(card)
})

const types = ['fuego', 'agua', 'planta', 'electrico', 'psiquico', 'normal', 'lucha']
function readCard(body: Record<string, unknown> = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const type = typeof body.type === 'string' ? body.type.trim() : ''
  const image = typeof body.image === 'string' ? body.image.trim() : ''
  const price = body.price
  if (!name || name.length > 40 || !types.includes(type) ||
      typeof price !== 'number' || !Number.isSafeInteger(price) || price <= 0) {
    throw Object.assign(new Error('Datos de la carta inválidos.'), { status: 400 })
  }
  return { name, type, price, image: image || '/img/poke-bola.png' }
}

// storeRoutes exige una sesión de administrador antes de entrar en estas rutas.
adminCardRoutes.post('/', async (req, res) => {
  const fields = readCard(req.body)
  const card = await CardModel.create({ ...fields, id: randomUUID() })
  res.status(201).json(card)
})

adminCardRoutes.put('/:id', async (req, res) => {
  const fields = readCard(req.body)
  const card = await CardModel.findOneAndUpdate({ id: req.params.id }, fields, { new: true })
  if (!card) {
    res.status(404).json({ error: 'Carta no encontrada.' })
    return
  }
  res.json(card)
})

adminCardRoutes.delete('/:id', async (req, res) => {
  await CardModel.deleteOne({ id: req.params.id })
  res.json({ ok: true })
})

adminCardRoutes.post('/reset', async (_req, res) => {
  // Si falla la inserción, MongoDB deshace también el borrado del catálogo anterior.
  await mongoose.connection.transaction(async session => {
    await CardModel.deleteMany({}, { session })
    await CardModel.insertMany(products, { session })
  })
  res.json({ ok: true })
})

export default publicRoutes
