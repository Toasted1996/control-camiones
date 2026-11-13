import { estadoViaje, saldoCuenta } from "@/dominio/cobros";

// Texto del select que comparten la lista, el detalle y la cuenta de cobro.
export const SELECT_VIAJE =
  "id, fecha, tipo, condicion_pago, clientes(nombre, contacto, plazo_dias), camiones(placa), conductores(nombre), " +
  "tramos(sentido, manifiesto, origen, destino, monto, comision_monto, cuentas_cobro(id, pagos(monto, retefuente, ica, tipo)))";

type Pago = { monto: number; retefuente: number; ica: number; tipo: string };
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
    cuentas_cobro: { pagos: Pago[] } | { pagos: Pago[] }[] | null;
  }[];
};

// Convierte una fila de Supabase en los números que muestran las pantallas.
// El saldo sale de saldoCuenta (dominio): total − pagos (anticipo incluido) − retenciones.
// Recibe `unknown` porque el cliente de Supabase no tiene tipos generados: la forma la fija SELECT_VIAJE.
export function resumirViaje(fila: unknown) {
  const f = fila as Fila;
  const tramos = [...f.tramos]
    .sort((a) => (a.sentido === "ida" ? -1 : 1))
    .map((t) => {
      const cuenta = Array.isArray(t.cuentas_cobro) ? t.cuentas_cobro[0] : t.cuentas_cobro;
      const pagos = cuenta?.pagos ?? [];
      const anticipo = pagos.filter((p) => p.tipo === "anticipo").reduce((s, p) => s + p.monto, 0);
      const saldo = saldoCuenta(t.monto, pagos);
      return {
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
    estado: estadoViaje(total, pagado),
  };
}

export type ViajeResumen = ReturnType<typeof resumirViaje>;
