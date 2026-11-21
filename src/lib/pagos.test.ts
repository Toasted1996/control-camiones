import { describe, expect, it } from "vitest";
import { validarPago } from "./pagos";

const base = { cuentaId: "c1", fecha: "2026-11-20", monto: 900_000, tipo: "abono", retefuente: 10_000, ica: 4_140 };

describe("validarPago", () => {
  it("acepta un pago con retenciones dentro del saldo", () => {
    const r = validarPago(base, 1_000_000);
    expect(r).toEqual({
      ok: true,
      datos: { cuenta_id: "c1", fecha: "2026-11-20", monto: 900_000, tipo: "abono", retefuente: 10_000, ica: 4_140 },
    });
  });
  it("acepta pagar justo el saldo", () => {
    expect(validarPago(base, 914_140).ok).toBe(true);
  });
  it("rechaza pasar el saldo contando retenciones", () => {
    expect(validarPago(base, 910_000)).toEqual({ ok: false, error: "El pago supera el saldo de la cuenta" });
  });
  it("rechaza pago en cero", () => {
    expect(validarPago({ ...base, monto: 0, retefuente: 0, ica: 0 }, 1_000_000).ok).toBe(false);
  });
  it("rechaza decimales y negativos", () => {
    expect(validarPago({ ...base, monto: 1000.5 }, 1_000_000).ok).toBe(false);
    expect(validarPago({ ...base, ica: -1 }, 1_000_000).ok).toBe(false);
  });
  it("rechaza fecha y tipo inválidos", () => {
    expect(validarPago({ ...base, fecha: "20/11/2026" }, 1_000_000).ok).toBe(false);
    expect(validarPago({ ...base, tipo: "anticipo" }, 1_000_000).ok).toBe(false);
  });
});
