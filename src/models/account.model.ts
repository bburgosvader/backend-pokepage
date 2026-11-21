import { Schema, model } from 'mongoose'

const accountSchema = new Schema({
  email: { type: String, unique: true, required: true },
  nombre: { type: String, required: true },
  passwordHash: { type: String, required: true },
  rol: { type: String, default: 'user' },
  deleted: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false },
  // Cambiar la versión invalida los tokens emitidos antes de un bloqueo.
  version: { type: Number, default: 0 }
})

export const Account = model('StoreAccount', accountSchema)
