import { gananciaReal } from "@/dominio/ganancia";

// Filas como las devuelve Supabase (cliente sin tipos generados): se aceptan como `unknown`.
type FilaViaje = { camion_id: string; tramos: { monto: number; comision_monto: number }[] };
type FilaGasto = { camion_id: string; tipo: string; monto: number };

export const SELECT_VIAJES_MES = "camion_id, tramos(monto, comision_monto)";
export const SELECT_GASTOS_MES = "id, camion_id, fecha, tipo, monto, km, nota";

// Resumen de un camión en un mes: los viajes cuentan desde que se hacen (devengado), cobrados o no.
export function resumirMes(viajes: unknown, gastos: unknown, camionId: string) {
  const vs = (viajes as FilaViaje[]).filter((v) => v.camion_id === camionId);
  const gs = (gastos as FilaGasto[]).filter((g) => g.camion_id === camionId);

  const tramos = vs.flatMap((v) => v.tramos);
  const ingresos = tramos.reduce((s, t) => s + t.monto, 0);
  const comisiones = tramos.reduce((s, t) => s + t.comision_monto, 0);
  const porTipo = { combustible: 0, peajes: 0, otros: 0 };
  for (const g of gs) if (g.tipo in porTipo) porTipo[g.tipo as keyof typeof porTipo] += g.monto;
  const total = gs.reduce((s, g) => s + g.monto, 0);

  return {
    viajes: vs.length,
    ingresos,
    comisiones,
    gastos: total,
    porTipo,
    ganancia: gananciaReal(ingresos, comisiones, total),
  };
}
