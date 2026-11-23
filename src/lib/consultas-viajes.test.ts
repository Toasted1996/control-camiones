import { describe, expect, it } from "vitest";
import { documentoDe, resumirViaje } from "./consultas-viajes";

type Pago = { monto: number; retefuente: number; ica: number; tipo: string };

const sinDatos = { quien: "Pedro", nit: "1", direccion: "", telefono: "", banco: "", tipoCuenta: "Ahorros", numero: "" };
const tramo = (sentido: string, monto: number, anticipo: number, extra: Pago[] = []) => ({
  sentido,
  manifiesto: "M-" + sentido,
  origen: "Bogotá",
  destino: "Cali",
  monto,
  comision_monto: 0,
  cuentas_cobro: {
    id: "c-" + sentido,
    documento: null,
    emitida: false,
    fecha_emision: null,
    vence: null,
    pagos: [...(anticipo ? [{ monto: anticipo, retefuente: 0, ica: 0, tipo: "anticipo" }] : []), ...extra],
  },
});
const viaje = (tramos: ReturnType<typeof tramo>[]) =>
  resumirViaje({
    id: "v1",
    fecha: "2026-11-20",
    tipo: "ida_regreso",
    condicion_pago: "anticipo_saldo_finalizar",
    clientes: { nombre: "ANDINA", contacto: null, plazo_dias: 30 },
    camiones: { placa: "ABC123" },
    conductores: { nombre: "Luis" },
    tramos,
  });

describe("documentoDe con pagos ya recibidos", () => {
  // Ida: 1.000.000 con anticipo de 200.000 y un abono de 500.000 (retefuente 10.000 e ICA 4.140).
  const abono = { monto: 500_000, retefuente: 10_000, ica: 4_140, tipo: "abono" };

  it("tiene en cuenta abonos y retenciones en el valor a cobrar, sin ponerlos en el documento", () => {
    const d = documentoDe(viaje([tramo("ida", 1_000_000, 200_000, [abono]), tramo("regreso", 800_000, 0)]), sinDatos);
    expect(d).toMatchObject({ total: 1_800_000, anticipo: 200_000, aCobrar: 1_085_860 });
    expect(d).not.toHaveProperty("abonos");
    expect(d).not.toHaveProperty("retenciones");
    expect(d.tramos[0]).toEqual(expect.not.objectContaining({ abonos: expect.anything() }));
  });
  it("si un tramo ya está pagado, solo se cobra el otro", () => {
    const pagado = { monto: 1_000_000, retefuente: 0, ica: 0, tipo: "saldo" };
    const d = documentoDe(viaje([tramo("ida", 1_000_000, 0, [pagado]), tramo("regreso", 800_000, 0)]), sinDatos);
    expect(d.aCobrar).toBe(800_000);
  });
  it("sin pagos el valor a cobrar es el total", () => {
    expect(documentoDe(viaje([tramo("ida", 1_000_000, 0)]), sinDatos).aCobrar).toBe(1_000_000);
  });
});

describe("documentoDe", () => {
  const v = viaje([tramo("regreso", 800_000, 100_000), tramo("ida", 1_000_000, 200_000)]);
  const d = documentoDe(v, sinDatos);

  it("ordena ida primero y suma total, anticipo y valor a cobrar", () => {
    expect(d.tramos.map((t) => t.sentido)).toEqual(["ida", "regreso"]);
    expect(d).toMatchObject({ total: 1_800_000, anticipo: 300_000, aCobrar: 1_500_000 });
  });
  it("lleva cliente, servicio y datos de quien cobra", () => {
    expect(d).toMatchObject({ cliente: { nombre: "ANDINA" }, fechaServicio: "2026-11-20", placa: "ABC123" });
    expect(d.datos.quien).toBe("Pedro");
  });
  it("antes de emitir no trae fechas de emisión", () => {
    expect(d).toMatchObject({ emision: null, vence: null });
  });
});
