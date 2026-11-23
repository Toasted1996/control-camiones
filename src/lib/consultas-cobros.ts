import { estadoDesdeSaldo } from "@/dominio/cobros";
import { diasEntre } from "@/dominio/fechas";
import { uno } from "./uno";

// Las cuentas salen de la vista cuentas_saldo (0009): el saldo ya viene calculado en la base.
// Solo las emitidas son "cobros": las que ya se entregaron al cliente.
export const VISTA_COBROS = "cuentas_saldo";
export const SELECT_COBRO = "id, total, emitida, fecha_emision, vence, saldo, n_pagos";
// Cliente, placa y manifiesto se piden aparte, a la tabla (no a la vista), de las cuentas que se muestran.
export const SELECT_COBRO_TRAMOS =
  "id, tramos(sentido, manifiesto, viaje_id, viajes(clientes(nombre), camiones(placa)))";
// Para los totales del resumen basta esto: sin tramos ni pagos.
export const SELECT_SALDOS = "saldo, vence";

type Fila = {
  id: string;
  total: number;
  emitida: boolean;
  fecha_emision: string | null;
  vence: string | null;
  saldo: number;
  n_pagos: number;
  tramos: unknown;
};
type TramoFila = {
  sentido: string;
  manifiesto: string;
  viaje_id: string;
  viajes: unknown;
};
type ViajeFila = { clientes: unknown; camiones: unknown };

// Totales del resumen a partir de las cuentas emitidas con saldo > 0 (la consulta ya las filtra).
export function totalesCobro(filas: unknown, hoy: string) {
  const cuentas = filas as { saldo: number; vence: string | null }[];
  return {
    porCobrar: cuentas.reduce((s, c) => s + Math.max(0, c.saldo), 0),
    vencido: cuentas.filter((c) => c.saldo > 0 && (c.vence ?? hoy) < hoy).reduce((s, c) => s + c.saldo, 0),
  };
}

// Convierte las cuentas de Supabase en tarjetas. Recibe `unknown` porque el cliente de Supabase no
// tiene tipos generados: la forma la fija SELECT_COBRO.
export function resumirCobros(filas: unknown, hoy: string) {
  return (filas as Fila[]).map((f) => {
    const tramo = uno(f.tramos as TramoFila | TramoFila[]);
    const viaje = uno(tramo.viajes as ViajeFila | ViajeFila[]);
    const vence = f.vence ?? hoy;
    const { estado, vencido } = estadoDesdeSaldo({ emitida: f.emitida, vence }, f.saldo, f.n_pagos, hoy);
    return {
      id: f.id,
      viajeId: tramo.viaje_id,
      cliente: uno(viaje.clientes as { nombre: string } | { nombre: string }[]).nombre,
      placa: uno(viaje.camiones as { placa: string } | { placa: string }[]).placa,
      sentido: tramo.sentido,
      manifiesto: tramo.manifiesto,
      total: f.total,
      saldo: f.saldo,
      estado,
      vencido,
      emision: f.fecha_emision,
      vence,
      diasVencida: vencido ? diasEntre(vence, hoy) : 0,
    };
  });
}

export type CobroItem = ReturnType<typeof resumirCobros>[number];
