import { describe, expect, it } from "vitest";
import { documentoDe, resumirViaje } from "./consultas-viajes";

const sinDatos = { quien: "Pedro", nit: "1", direccion: "", telefono: "", banco: "", tipoCuenta: "Ahorros", numero: "" };
const tramo = (sentido: string, monto: number, anticipo: number) => ({
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
    pagos: anticipo ? [{ monto: anticipo, retefuente: 0, ica: 0, tipo: "anticipo" }] : [],
  },
});

describe("documentoDe", () => {
  const v = resumirViaje({
    id: "v1",
    fecha: "2026-11-20",
    tipo: "ida_regreso",
    condicion_pago: "anticipo_saldo_finalizar",
    clientes: { nombre: "ANDINA", contacto: null, plazo_dias: 30 },
    camiones: { placa: "ABC123" },
    conductores: { nombre: "Luis" },
    tramos: [tramo("regreso", 800_000, 100_000), tramo("ida", 1_000_000, 200_000)],
  });
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
