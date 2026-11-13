import jwt from 'jsonwebtoken';

export const validarToken = (req, res, next) => {
  // Obtener el header 'Authorization'
  const authHeader = req.headers['authorization'];
  
  // Extraer el token del formato "Bearer <token>"
  const token = authHeader?.split(' ')[1];

  // Si no hay token, responder 401 (No autorizado)
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  // Verificar la firma y expiración del token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // 403 Forbidden si el token es inválido o ha expirado
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }

    // Guardar el payload decodificado en la petición
    req.user = decoded;
    next();
  });
};
