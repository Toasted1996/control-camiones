import { describe, expect, it } from "vitest";
import { gananciaReal } from "./ganancia";

describe("gananciaReal", () => {
  it("ingresos menos comisión y gastos", () => {
    expect(gananciaReal(2_800_000, 672_000, 410_000)).toBe(1_718_000);
  });
  it("puede dar negativo cuando los gastos superan lo que quedó", () => {
    expect(gananciaReal(1_000_000, 240_000, 900_000)).toBe(-140_000);
  });
  it("sin movimiento es cero", () => {
    expect(gananciaReal(0, 0, 0)).toBe(0);
  });
});
