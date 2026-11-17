import express from "express";
import { iniciarSesion } from '../services/auth.service.js';

// Creación del router
const router = express.Router();

// Creación de la ruta para iniciar sesión
router.post("/iniciar-sesion", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Intentamos iniciar sesión con las credenciales proporcionadas
  const user = await iniciarSesion(email, password);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
});
// exportación del router
export default router;