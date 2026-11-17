export type Rol = "admin" | "user";

export interface Usuario {
  id: number;
  email: string;
  contraseña: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}

export interface JwtPayload {
  email: string;
  rol: Rol;
}