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
// Totales del resumen (por cobrar y vencido): una sola fila ya sumada en la base (vista cobros_totales),
// para que no se corten en las 1.000 filas que devuelve la API.
export const VISTA_TOTALES = "cobros_totales";
export const SELECT_TOTALES = "por_cobrar, vencido";

// La fila de cobros_totales como números de la app.
export function totalesCobro(fila: unknown) {
  const f = fila as { por_cobrar: number; vencido: number };
  return { porCobrar: f.por_cobrar, vencido: f.vencido };
}

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
