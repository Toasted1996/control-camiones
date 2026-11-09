import { describe, expect, it } from "vitest";
import { rendicionAnticipo } from "./anticipo";

describe("rendicionAnticipo", () => {
  it("devuelve lo que sobra", () => {
    expect(rendicionAnticipo(400000, 90000, 288000)).toBe(22000);
  });

  it("negativo cuando falta dinero", () => {
    expect(rendicionAnticipo(300000, 90000, 288000)).toBe(-78000);
  });

  it("cero cuando cuadra exacto", () => {
    expect(rendicionAnticipo(378000, 90000, 288000)).toBe(0);
  });
});
