import { describe, expect, it } from "vitest";
import { armarViaje, type ViajeEntrada } from "./viajes";

const tramo = { manifiesto: "100", origen: "", destino: "", monto: 1_000_000, anticipo: 0 };
const base: ViajeEntrada = {
  camionId: "c",
  conductorId: "d",
  clienteId: "k",
  fecha: "2026-11-11",
  condicionPago: "al_finalizar",
  tramos: [tramo],
};

describe("armarViaje", () => {
  it("solo ida: un tramo con comisión del 24 %", () => {
    const r = armarViaje(base, 24);
    if (!r.ok) throw new Error(r.error);
    expect(r.datos.tipo).toBe("ida");
    expect(r.datos.tramos).toHaveLength(1);
    expect(r.datos.tramos[0]).toMatchObject({ sentido: "ida", comision_pct: 24, comision_monto: 240_000, origen: null });
  });

  it("ida y regreso: dos tramos, cada uno con su comisión y su anticipo", () => {
    const r = armarViaje(
      {
        ...base,
        condicionPago: "anticipo_saldo_finalizar",
        tramos: [
          { ...tramo, anticipo: 500_000 },
          { ...tramo, manifiesto: "101", monto: 1_800_000, anticipo: 300_000 },
        ],
      },
      24,
    );
    if (!r.ok) throw new Error(r.error);
    expect(r.datos.tipo).toBe("ida_regreso");
    expect(r.datos.tramos.map((t) => t.sentido)).toEqual(["ida", "regreso"]);
    expect(r.datos.tramos.map((t) => t.comision_monto)).toEqual([240_000, 432_000]);
    expect(r.datos.tramos.map((t) => t.anticipo)).toEqual([500_000, 300_000]);
  });

  it("ignora el anticipo si la condición de pago no lo incluye", () => {
    const r = armarViaje({ ...base, tramos: [{ ...tramo, anticipo: 500_000 }] }, 24);
    if (!r.ok) throw new Error(r.error);
    expect(r.datos.tramos[0].anticipo).toBe(0);
  });

  it.each([
    ["monto cero", { ...base, tramos: [{ ...tramo, monto: 0 }] }],
    ["manifiesto vacío", { ...base, tramos: [{ ...tramo, manifiesto: "  " }] }],
    ["anticipo mayor al monto", { ...base, condicionPago: "anticipo_saldo_plazo", tramos: [{ ...tramo, anticipo: 2_000_000 }] }],
    ["manifiestos repetidos", { ...base, tramos: [tramo, { ...tramo }] }],
    ["sin cliente", { ...base, clienteId: "" }],
    ["fecha mala", { ...base, fecha: "11/11/2026" }],
  ])("rechaza: %s", (_nombre, entrada) => {
    expect(armarViaje(entrada, 24).ok).toBe(false);
  });
});
