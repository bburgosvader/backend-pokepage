import jwt from "jsonwebtoken";
import { obtenerUsuarioPorEmailYContrasena } from '../repositories/usersRepository.js';

export const iniciarSesion = async (email, password) => {
  // Buscamos un usuario que coincida con el correo electrónico y la contraseña proporcionados
  const usuario = await obtenerUsuarioPorEmailYContrasena(email, password);
  if (!usuario) {
    throw new Error("Credenciales inválidas");
  }
  // Generamos un token JWT para el usuario autenticado
  const token = jwt.sign(
    { email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  // Retornamos la información del usuario y el token generado
  return {
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    rol: usuario.rol,
    token
  }
}
