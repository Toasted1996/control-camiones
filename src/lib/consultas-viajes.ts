import { estadoViaje, saldoCuenta } from "@/dominio/cobros";

// Texto del select que comparten la lista, el detalle y la cuenta de cobro.
export const SELECT_VIAJE =
  "id, fecha, tipo, condicion_pago, clientes(nombre, contacto, plazo_dias), camiones(placa), conductores(nombre), " +
  "tramos(sentido, manifiesto, origen, destino, monto, comision_monto, cuentas_cobro(id, emitida, fecha_emision, vence, pagos(monto, retefuente, ica, tipo)))";

type Pago = { monto: number; retefuente: number; ica: number; tipo: string };
type Cuenta = {
  id: string;
  emitida: boolean;
  fecha_emision: string | null;
  vence: string | null;
  pagos: Pago[];
};
type Fila = {
  id: string;
  fecha: string;
  tipo: string;
  condicion_pago: string;
  clientes: { nombre: string; contacto: string | null; plazo_dias: number | null };
  camiones: { placa: string };
  conductores: { nombre: string };
  tramos: {
    sentido: string;
    manifiesto: string;
    origen: string | null;
    destino: string | null;
    monto: number;
    comision_monto: number;
    // 1 a 1: PostgREST devuelve objeto; se acepta lista por si cambia.
    cuentas_cobro: Cuenta | Cuenta[] | null;
  }[];
};

// Convierte una fila de Supabase en los números que muestran las pantallas.
// El saldo sale de saldoCuenta (dominio): total − pagos (anticipo incluido) − retenciones.
// Recibe `unknown` porque el cliente de Supabase no tiene tipos generados: la forma la fija SELECT_VIAJE.
export function resumirViaje(fila: unknown) {
  const f = fila as Fila;
  const cuentaDe = (t: Fila["tramos"][number]) =>
    Array.isArray(t.cuentas_cobro) ? t.cuentas_cobro[0] : t.cuentas_cobro;
  const ordenados = [...f.tramos].sort((a, b) => Number(b.sentido === "ida") - Number(a.sentido === "ida"));
  // El documento es uno por viaje y se emite junto: se lee de la cuenta del tramo de ida.
  const cuentaIda = cuentaDe(ordenados[0]);
  const tramos = ordenados
    .map((t) => {
      const pagos = cuentaDe(t)?.pagos ?? [];
      const anticipo = pagos.filter((p) => p.tipo === "anticipo").reduce((s, p) => s + p.monto, 0);
      const saldo = saldoCuenta(t.monto, pagos);
      return {
        cuentaId: cuentaDe(t)?.id ?? null,
        sentido: t.sentido,
        manifiesto: t.manifiesto,
        origen: t.origen,
        destino: t.destino,
        monto: t.monto,
        comision: t.comision_monto,
        anticipo,
        pagado: t.monto - saldo,
        saldo,
      };
    });
  const suma = (k: "monto" | "comision" | "anticipo" | "pagado" | "saldo") =>
    tramos.reduce((s, t) => s + t[k], 0);
  const total = suma("monto");
  const pagado = suma("pagado");
  return {
    id: f.id,
    fecha: f.fecha,
    tipo: f.tipo,
    condicion: f.condicion_pago,
    cliente: f.clientes,
    placa: f.camiones.placa,
    conductor: f.conductores.nombre,
    tramos,
    total,
    comision: suma("comision"),
    anticipo: suma("anticipo"),
    pagado,
    saldo: suma("saldo"),
    emitida: !!cuentaIda?.emitida,
    emision: cuentaIda?.fecha_emision ?? null,
    vence: cuentaIda?.vence ?? null,
    estado: estadoViaje(total, pagado, !!cuentaIda?.emitida),
  };
}

export type ViajeResumen = ReturnType<typeof resumirViaje>;
