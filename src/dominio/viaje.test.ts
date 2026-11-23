import { describe, expect, it } from "vitest";
import { estadoViaje } from "./cobros";

describe("estadoViaje", () => {
  it("sin pagos y sin emitir: sin cobrar", () => expect(estadoViaje(1_000_000, 0, false)).toBe("sin_cobrar"));
  it("emitida sin pagos: cobrado", () => expect(estadoViaje(1_000_000, 0, true)).toBe("cobrado"));
  it("con anticipo o abono y la cuenta emitida: abonado", () => {
    expect(estadoViaje(1_000_000, 400_000, true)).toBe("abonado");
  });
  it("con anticipo pero sin emitir la cuenta: sigue en sin cobrar (no se pierde de esa lista)", () => {
    expect(estadoViaje(1_000_000, 400_000, false)).toBe("sin_cobrar");
  });
  it("pagado completo sin emitir: pagado", () => expect(estadoViaje(1_000_000, 1_000_000, false)).toBe("pagado"));
  it("pagado completo: pagado", () => expect(estadoViaje(1_000_000, 1_000_000, true)).toBe("pagado"));
});
