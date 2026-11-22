import { describe, expect, it } from "vitest";
import { validarGasto } from "./gastos";

const base = { camionId: "c1", viajeId: "v1", fecha: "2026-11-20", tipo: "peajes", monto: 85_000, km: 120_500, nota: "  Peaje Cajicá " };

describe("validarGasto", () => {
  it("acepta un gasto del viaje y limpia la nota", () => {
    expect(validarGasto(base)).toEqual({
      ok: true,
      datos: { camion_id: "c1", viaje_id: "v1", fecha: "2026-11-20", tipo: "peajes", monto: 85_000, km: 120_500, nota: "Peaje Cajicá" },
    });
  });
  it("acepta un gasto suelto sin km ni nota", () => {
    const r = validarGasto({ ...base, viajeId: null, km: null, nota: " " });
    expect(r).toMatchObject({ ok: true, datos: { viaje_id: null, km: null, nota: null } });
  });
  it.each([
    ["monto cero", { ...base, monto: 0 }],
    ["monto con decimales", { ...base, monto: 1000.5 }],
    ["km negativo", { ...base, km: -1 }],
    ["tipo desconocido", { ...base, tipo: "multa" }],
    ["fecha mala", { ...base, fecha: "20/11/2026" }],
    ["sin camión", { ...base, camionId: "" }],
  ])("rechaza: %s", (_nombre, entrada) => {
    expect(validarGasto(entrada).ok).toBe(false);
  });
});
