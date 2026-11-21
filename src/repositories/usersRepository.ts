
// Lista temporal para almacenar usuarios registrados

import { Usuario } from "../types/user.js";

// Esto en producción va a cambiar porque NUNCA SE DEBEN DE ALMACENAR CONTRASEÑAS EN TEXTO PLANO
export const users: Usuario[] = [
  {
    id: 1,
    email: "felipe@example.com",
    contraseña: "felipe1234",
    nombre: "felipe",
    apellido: "rios",
    rol: "admin"
  },
  {
    id: 1,
    email: "bryan@example.com",
    contraseña: "bryan1234",
    nombre: "bryan",
    apellido: "burgos",
    rol: "admin"
  },
  {
    id: 1,
    email: "ignacio@example.com",
    contraseña: "ignacio1234",
    nombre: "ignacio",
    apellido: "moya",
    rol: "admin"
  }
];

export const obtenerUsuarioPorEmailYContrasena = async (email: string, password: string): Promise<Usuario | undefined> => {
  return users.find(
    (u) => u.email === email && u.contraseña === password
  );
}
