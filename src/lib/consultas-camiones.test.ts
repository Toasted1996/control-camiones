import { describe, expect, it } from "vitest";
import { resumirMes } from "./consultas-camiones";

const viajes = [
  { camion_id: "a", tramos: [{ monto: 1_000_000, comision_monto: 240_000 }, { monto: 1_800_000, comision_monto: 432_000 }] },
  { camion_id: "a", tramos: [{ monto: 500_000, comision_monto: 120_000 }] },
  { camion_id: "b", tramos: [{ monto: 9_000_000, comision_monto: 2_160_000 }] },
];
const gastos = [
  { camion_id: "a", tipo: "combustible", monto: 300_000 },
  { camion_id: "a", tipo: "peajes", monto: 85_000 },
  { camion_id: "a", tipo: "otros", monto: 15_000 },
  { camion_id: "b", tipo: "combustible", monto: 700_000 },
];

describe("resumirMes", () => {
  it("suma solo los viajes y gastos del camión y calcula la ganancia", () => {
    expect(resumirMes(viajes, gastos, "a")).toEqual({
      viajes: 2,
      ingresos: 3_300_000,
      comisiones: 792_000,
      gastos: 400_000,
      porTipo: { combustible: 300_000, peajes: 85_000, otros: 15_000 },
      ganancia: 2_108_000,
    });
  });
  it("un camión sin movimiento da todo en cero", () => {
    expect(resumirMes(viajes, gastos, "c")).toMatchObject({ viajes: 0, ingresos: 0, gastos: 0, ganancia: 0 });
  });
});
