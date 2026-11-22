import { describe, expect, it } from "vitest";
import { limitesMes, sumarMeses } from "./fechas";

describe("meses", () => {
  it("suma y resta meses cruzando el año", () => {
    expect(sumarMeses("2026-12", 1)).toBe("2027-01");
    expect(sumarMeses("2026-01", -1)).toBe("2025-12");
    expect(sumarMeses("2026-11", 0)).toBe("2026-11");
  });
  it("da los límites del mes", () => {
    expect(limitesMes("2026-11")).toEqual({ desde: "2026-11-01", hasta: "2026-12-01" });
    expect(limitesMes("2026-12")).toEqual({ desde: "2026-12-01", hasta: "2027-01-01" });
  });
});
