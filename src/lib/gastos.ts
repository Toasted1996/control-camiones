export const TIPOS_GASTO = [
  { valor: "combustible", texto: "Combustible" },
  { valor: "peajes", texto: "Peajes" },
  { valor: "otros", texto: "Otros" },
];

export type GastoEntrada = {
  camionId: string;
  viajeId: string | null; // null = gasto suelto del camión
  fecha: string; // ISO yyyy-mm-dd
  tipo: string;
  monto: number; // pesos enteros
  km: number | null; // odómetro, opcional
  nota: string;
};

// Valida el gasto y arma la fila para `gastos`. Que el viaje sea del mismo camión se comprueba en
// la acción, porque necesita la base de datos.
export function validarGasto(e: GastoEntrada) {
  const error = (mensaje: string) => ({ ok: false as const, error: mensaje });

  if (!e.camionId) return error("Falta elegir el camión");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.fecha)) return error("La fecha no es válida");
  if (!TIPOS_GASTO.some((t) => t.valor === e.tipo)) return error("El tipo de gasto no es válido");
  if (!Number.isInteger(e.monto) || e.monto <= 0) return error("El monto debe ser mayor que cero");
  if (e.km !== null && (!Number.isInteger(e.km) || e.km < 0)) return error("El kilometraje no es válido");

  return {
    ok: true as const,
    datos: {
      camion_id: e.camionId,
      viaje_id: e.viajeId || null,
      fecha: e.fecha,
      tipo: e.tipo,
      monto: e.monto,
      km: e.km,
      nota: e.nota.trim().slice(0, 200) || null,
    },
  };
}
