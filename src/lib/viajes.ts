import { comisionDe } from "@/dominio/cobros";

export type TramoEntrada = {
  manifiesto: string;
  origen: string;
  destino: string;
  monto: number; // pesos enteros
  anticipo: number; // pesos enteros, 0 si no hay
};

export type ViajeEntrada = {
  camionId: string;
  conductorId: string;
  clienteId: string;
  fecha: string; // ISO yyyy-mm-dd
  condicionPago: string;
  tramos: TramoEntrada[]; // 1 = solo ida, 2 = ida y regreso
};

const CONDICIONES = ["al_finalizar", "anticipo_saldo_finalizar", "anticipo_saldo_plazo", "a_plazo"];

// Valida la entrada y arma el paquete que espera la función crear_viaje (0003). La comisión se calcula
// aquí con comisionDe y se guarda por tramo; la base de datos no la recalcula.
export function armarViaje(e: ViajeEntrada, comisionPct: number) {
  const error = (mensaje: string) => ({ ok: false as const, error: mensaje });

  if (!e.camionId || !e.conductorId || !e.clienteId) return error("Falta elegir camión, conductor o cliente");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.fecha)) return error("La fecha no es válida");
  if (!CONDICIONES.includes(e.condicionPago)) return error("La condición de pago no es válida");
  if (e.tramos.length < 1 || e.tramos.length > 2) return error("Un viaje tiene uno o dos tramos");

  const conAnticipo = e.condicionPago.startsWith("anticipo");
  const manifiestos = e.tramos.map((t) => t.manifiesto.trim());
  if (manifiestos.some((m) => !m)) return error("Falta el manifiesto");
  if (new Set(manifiestos).size !== manifiestos.length) return error("Los dos tramos no pueden tener el mismo manifiesto");

  for (const t of e.tramos) {
    if (!Number.isInteger(t.monto) || t.monto <= 0) return error("El monto debe ser mayor que cero");
    if (!Number.isInteger(t.anticipo) || t.anticipo < 0) return error("El anticipo no es válido");
    if (conAnticipo && t.anticipo > t.monto) return error("El anticipo no puede superar el monto del tramo");
  }

  return {
    ok: true as const,
    datos: {
      camion_id: e.camionId,
      conductor_id: e.conductorId,
      cliente_id: e.clienteId,
      fecha: e.fecha,
      tipo: e.tramos.length === 2 ? "ida_regreso" : "ida",
      condicion_pago: e.condicionPago,
      tramos: e.tramos.map((t, i) => ({
        sentido: i === 0 ? "ida" : "regreso",
        manifiesto: manifiestos[i],
        origen: t.origen.trim() || null,
        destino: t.destino.trim() || null,
        monto: t.monto,
        comision_pct: comisionPct,
        comision_monto: comisionDe({ monto: t.monto }, comisionPct),
        // Sin condición de anticipo, cualquier valor escrito se ignora.
        anticipo: conAnticipo ? t.anticipo : 0,
      })),
    },
  };
}
