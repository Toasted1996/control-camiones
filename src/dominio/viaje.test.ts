import { describe, expect, it } from "vitest";
import { estadoViaje } from "./cobros";
import { sumarDias } from "./fechas";

describe("estadoViaje", () => {
  it("sin pagos ni anticipo: sin cobrar", () => expect(estadoViaje(1_000_000, 0)).toBe("sin_cobrar"));
  it("con anticipo o abono: abonado", () => expect(estadoViaje(1_000_000, 400_000)).toBe("abonado"));
  it("pagado completo: pagado", () => expect(estadoViaje(1_000_000, 1_000_000)).toBe("pagado"));
});

describe("sumarDias", () => {
  it("suma dentro del mes", () => expect(sumarDias("2026-11-13", 30)).toBe("2026-12-13"));
  it("cruza de año", () => expect(sumarDias("2026-12-20", 15)).toBe("2027-01-04"));
});
