
import express from "express";
import { validarToken } from '../middlewares/validarTokenMiddleware.js';

// Creación del router
const router = express.Router();
// Configuiramos que el router use el middleware
// para revisar el token en todas las rutas
router.use(validarToken)

router.get("", (req, res) => {
  res.json({ message: "Ruta protegida, acceso concedido", user: req.user });
})

export default router;
