import { estadoCobro, saldoCuenta, type Pago } from "@/dominio/cobros";
import { diasEntre } from "@/dominio/fechas";
import { uno } from "./uno";

// Solo las cuentas emitidas son "cobros": las que ya se entregaron al cliente.
export const SELECT_COBRO =
  "id, total, emitida, fecha_emision, vence, " +
  "tramos(sentido, manifiesto, viaje_id, viajes(clientes(nombre), camiones(placa))), " +
  "pagos(monto, retefuente, ica)";


type Fila = {
  id: string;
  total: number;
  emitida: boolean;
  fecha_emision: string | null;
  vence: string | null;
  tramos: unknown;
  pagos: Pago[];
};
type TramoFila = {
  sentido: string;
  manifiesto: string;
  viaje_id: string;
  viajes: unknown;
};
type ViajeFila = { clientes: unknown; camiones: unknown };

// Convierte las cuentas de Supabase en tarjetas y totales. Recibe `unknown` porque el cliente de
// Supabase no tiene tipos generados: la forma la fija SELECT_COBRO.
export function resumirCobros(filas: unknown, hoy: string) {
  const items = (filas as Fila[]).map((f) => {
    const tramo = uno(f.tramos as TramoFila | TramoFila[]);
    const viaje = uno(tramo.viajes as ViajeFila | ViajeFila[]);
    const vence = f.vence ?? hoy;
    const { estado, vencido } = estadoCobro({ emitida: f.emitida, total: f.total, vence }, f.pagos, hoy);
    return {
      id: f.id,
      viajeId: tramo.viaje_id,
      cliente: uno(viaje.clientes as { nombre: string } | { nombre: string }[]).nombre,
      placa: uno(viaje.camiones as { placa: string } | { placa: string }[]).placa,
      sentido: tramo.sentido,
      manifiesto: tramo.manifiesto,
      total: f.total,
      saldo: saldoCuenta(f.total, f.pagos),
      estado,
      vencido,
      emision: f.fecha_emision,
      vence,
      diasVencida: vencido ? diasEntre(vence, hoy) : 0,
    };
  });
  return {
    items,
    porCobrar: items.reduce((s, c) => s + Math.max(0, c.saldo), 0),
    vencido: items.filter((c) => c.vencido).reduce((s, c) => s + c.saldo, 0),
  };
}

export type CobroItem = ReturnType<typeof resumirCobros>["items"][number];
