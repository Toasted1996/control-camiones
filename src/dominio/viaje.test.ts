import { describe, expect, it } from "vitest";
import { estadoViaje } from "./cobros";
import { sumarDias } from "./fechas";

describe("estadoViaje", () => {
  it("sin pagos y sin emitir: sin cobrar", () => expect(estadoViaje(1_000_000, 0, false)).toBe("sin_cobrar"));
  it("emitida sin pagos: cobrado", () => expect(estadoViaje(1_000_000, 0, true)).toBe("cobrado"));
  it("con anticipo o abono: abonado, emitida o no", () => {
    expect(estadoViaje(1_000_000, 400_000, false)).toBe("abonado");
    expect(estadoViaje(1_000_000, 400_000, true)).toBe("abonado");
  });
  it("pagado completo: pagado", () => expect(estadoViaje(1_000_000, 1_000_000, true)).toBe("pagado"));
});

describe("sumarDias", () => {
  it("suma dentro del mes", () => expect(sumarDias("2026-11-13", 30)).toBe("2026-12-13"));
  it("cruza de año", () => expect(sumarDias("2026-12-20", 15)).toBe("2027-01-04"));
});
