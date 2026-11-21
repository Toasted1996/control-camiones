// Nombre de empresa normalizado: sin espacios de más y en MAYÚSCULAS. Es la misma regla que aplica la
// base de datos (normalizar_nombre, migración 0007); aquí sirve para avisar antes de guardar.
export const normalizarNombre = (nombre: string) => nombre.trim().replace(/\s+/g, " ").toUpperCase();

// Clave para comparar: el nombre normalizado sin tildes (la Ñ se conserva). Igual que nombre_clave en la base.
export const claveNombre = (nombre: string) =>
  normalizarNombre(nombre).replace(/[ÁÉÍÓÚÜ]/g, (c) => "AEIOUU"["ÁÉÍÓÚÜ".indexOf(c)]);
