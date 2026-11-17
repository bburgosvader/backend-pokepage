import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { JwtPayload } from "../types/user.js";

export const validarToken = (req: Request, res: Response, next: NextFunction) => {
  // Obtener el header 'Authorization'
  const authHeader = req.headers["authorization"];

  // Extraer el token del formato "Bearer <token>"
  const token = authHeader?.split(" ")[1];

  // Si no hay token, responder 401 (No autorizado)
  if (!token) {
    res.status(401).json({ message: "Token no proporcionado" });
    return;
  }

  // Verificar la firma y expiración del token
  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      // 403 Forbidden si el token es inválido o ha expirado
      res.status(403).json({ message: "Token inválido o expirado" });
      return;
    }

    // Guardar el payload decodificado en la petición
    req.user = decoded as JwtPayload;
    next();
  });
};