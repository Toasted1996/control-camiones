import { estadoViaje, saldoCuenta } from "@/dominio/cobros";
import { uno } from "./uno";

// Select que comparten las pantallas de viajes. `cuenta` son las columnas de cuentas_cobro.
const selectViaje = (cuenta: string) =>
  "id, fecha, tipo, condicion_pago, clientes(nombre, contacto, plazo_dias), camiones(placa), conductores(nombre), " +
  `tramos(sentido, manifiesto, origen, destino, monto, comision_monto, cuentas_cobro(${cuenta}, pagos(monto, retefuente, ica, tipo)))`;

// Detalle, cuenta de cobro y emisión: incluye el documento guardado.
export const SELECT_VIAJE = selectViaje("id, documento, emitida, fecha_emision, vence");
// Lista: sin el documento (puede pesar y la lista no lo muestra).
export const SELECT_VIAJE_LISTA = selectViaje("id, emitida, fecha_emision, vence");

type Pago = { monto: number; retefuente: number; ica: number; tipo: string };
// Datos de quien cobra: se escriben en cada emisión (el sistema no sabe quién es el dueño del camión).
export type DatosPago = {
  quien: string;
  nit: string;
  direccion: string;
  telefono: string;
  banco: string;
  tipoCuenta: string;
  numero: string;
};

// La cuenta de cobro tal como se entrega. Al emitir se guarda completa (cuentas_cobro.documento)
// y de ahí se muestra siempre: es el histórico, no cambia si después cambia el viaje o el cliente.
export type DocumentoCuenta = {
  cliente: { nombre: string; contacto: string | null };
  fechaServicio: string;
  placa: string;
  tramos: { sentido: string; origen: string | null; destino: string | null; monto: number; anticipo: number }[];
  total: number;
  anticipo: number;
  // Lo que falta por cobrar: ya descuenta abonos y retenciones, pero el documento no los muestra.
  aCobrar: number;
  datos: DatosPago;
  emision: string | null; // null en la vista previa; la base los fija al emitir
  vence: string | null;
};

// Arma el documento a partir del viaje y los datos de quien cobra. Lo usa la vista previa en pantalla
// y la acción de emitir (que lo guarda): una sola fuente para lo que se ve y lo que se guarda.
export function documentoDe(v: ViajeResumen, datos: DatosPago): DocumentoCuenta {
  return {
    cliente: { nombre: v.cliente.nombre, contacto: v.cliente.contacto },
    fechaServicio: v.fecha,
    placa: v.placa,
    tramos: v.tramos.map((t) => ({
      sentido: t.sentido,
      origen: t.origen,
      destino: t.destino,
      monto: t.monto,
      anticipo: t.anticipo,
    })),
    total: v.total,
    anticipo: v.anticipo,
    aCobrar: v.saldo, // tiene en cuenta todos los pagos y retenciones (saldoCuenta)
    datos,
    emision: v.emision,
    vence: v.vence,
  };
}

type Cuenta = {
  id: string;
  documento?: DocumentoCuenta | null; // ausente en la lista (SELECT_VIAJE_LISTA)
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
  const cuentaDe = (t: Fila["tramos"][number]) => (t.cuentas_cobro ? uno(t.cuentas_cobro) : null);
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
    documento: cuentaIda?.documento ?? null,
    emision: cuentaIda?.fecha_emision ?? null,
    vence: cuentaIda?.vence ?? null,
    estado: estadoViaje(total, pagado, !!cuentaIda?.emitida),
  };
}

export type ViajeResumen = ReturnType<typeof resumirViaje>;
