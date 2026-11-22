// Nombre de empresa normalizado: sin espacios de más y en MAYÚSCULAS. Es la misma regla que aplica la
// base de datos (normalizar_nombre, migración 0007); aquí sirve para avisar antes de guardar.
export const normalizarNombre = (nombre: string) => nombre.trim().replace(/\s+/g, " ").toUpperCase();

// Clave para comparar: el nombre normalizado sin tildes (la Ñ se conserva). Igual que nombre_clave en la base.
export const claveNombre = (nombre: string) =>
  normalizarNombre(nombre).replace(/[ÁÉÍÓÚÜ]/g, (c) => "AEIOUU"["ÁÉÍÓÚÜ".indexOf(c)]);

// Número escrito a mano, con coma o punto decimal. NaN si no es un número.
const decimal = (texto: string) => (/^\d+([.,]\d+)?$/.test(texto.trim()) ? Number(texto.trim().replace(",", ".")) : NaN);

// Para mostrar un porcentaje o un "por mil" con coma decimal: 4.14 → "4,14".
export const verNumero = (n: number | string) => Number(n).toLocaleString("es-CO", { maximumFractionDigits: 3 });

export type ClienteEntrada = { contacto: string; plazo: string; retefuente: string; ica: string };

// Valida lo que se edita de un cliente y arma los cambios para `clientes`. El plazo vacío significa
// "sin plazo" (la cuenta vence el día que se emite). Los límites son los de la tabla.
export function validarCliente(e: ClienteEntrada) {
  const error = (mensaje: string) => ({ ok: false as const, error: mensaje });

  const plazo = e.plazo.trim() === "" ? null : Number(e.plazo.trim());
  if (plazo !== null && (!Number.isInteger(plazo) || plazo < 0 || plazo > 365)) {
    return error("El plazo debe ser un número entero de días, de 0 a 365");
  }
  const retefuente = decimal(e.retefuente);
  if (!(retefuente >= 0 && retefuente <= 100)) return error("La retefuente debe estar entre 0 y 100 %");
  const ica = decimal(e.ica);
  if (!(ica >= 0 && ica <= 1000)) return error("El ICA debe estar entre 0 y 1000 por mil");

  return {
    ok: true as const,
    datos: {
      contacto: e.contacto.trim().slice(0, 200) || null,
      plazo_dias: plazo,
      retefuente_pct: Math.round(retefuente * 100) / 100, // numeric(5,2)
      ica_por_mil: Math.round(ica * 1000) / 1000, // numeric(6,3)
    },
  };
}
