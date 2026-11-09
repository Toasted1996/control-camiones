import { describe, expect, it } from "vitest";
import {
  baseComision,
  comisionDe,
  estadoCobro,
  ica,
  retefuente,
  saldoCuenta,
} from "./cobros";

describe("comisión", () => {
  it("la base es el monto bruto del tramo", () => {
    expect(baseComision({ monto: 1200000 })).toBe(1200000);
  });

  it("24 % por defecto", () => {
    expect(comisionDe({ monto: 1200000 })).toBe(288000);
    expect(comisionDe({ monto: 1000000 })).toBe(240000);
  });

  it("porcentaje editable", () => {
    expect(comisionDe({ monto: 1000000 }, 20)).toBe(200000);
  });

  it("redondea a pesos enteros", () => {
    expect(comisionDe({ monto: 1001 })).toBe(240); // 240,24
  });
});

describe("retenciones", () => {
  it("retefuente 1 % de 1.200.000 = 12.000", () => {
    expect(retefuente(1200000)).toBe(12000);
  });

  it("ICA 4,14 por mil de 1.200.000 = 4.968", () => {
    expect(ica(1200000)).toBe(4968);
  });

  it("porcentajes editables", () => {
    expect(retefuente(1200000, 2)).toBe(24000);
    expect(ica(1000000, 10)).toBe(10000);
  });
});

describe("saldoCuenta", () => {
  it("sin pagos el saldo es el total", () => {
    expect(saldoCuenta(1200000, [])).toBe(1200000);
  });

  it("descuenta monto + retefuente + ICA de cada pago", () => {
    const pagos = [{ monto: 1183032, retefuente: 12000, ica: 4968 }];
    expect(saldoCuenta(1200000, pagos)).toBe(0);
  });

  it("abono parcial deja saldo", () => {
    const pagos = [{ monto: 500000, retefuente: 0, ica: 0 }];
    expect(saldoCuenta(1200000, pagos)).toBe(700000);
  });
});

describe("estadoCobro", () => {
  const cuenta = { emitida: true, total: 1200000, vence: "2026-11-10" };

  it("no emitida: sin cobrar", () => {
    const r = estadoCobro({ ...cuenta, emitida: false }, [], "2026-11-01");
    expect(r).toEqual({ estado: "sin_cobrar", vencido: false });
  });

  it("emitida sin pagos: cobrado", () => {
    expect(estadoCobro(cuenta, [], "2026-11-01")).toEqual({
      estado: "cobrado",
      vencido: false,
    });
  });

  it("con pagos y saldo: abonado", () => {
    const pagos = [{ monto: 500000, retefuente: 0, ica: 0 }];
    expect(estadoCobro(cuenta, pagos, "2026-11-01").estado).toBe("abonado");
  });

  it("saldo 0: pagado y nunca vencido", () => {
    const pagos = [{ monto: 1183032, retefuente: 12000, ica: 4968 }];
    expect(estadoCobro(cuenta, pagos, "2026-12-01")).toEqual({
      estado: "pagado",
      vencido: false,
    });
  });

  it("vencido el día siguiente al vencimiento, no el mismo día", () => {
    expect(estadoCobro(cuenta, [], "2026-11-10").vencido).toBe(false);
    expect(estadoCobro(cuenta, [], "2026-11-11").vencido).toBe(true);
  });

  it("abonado y vencido a la vez", () => {
    const pagos = [{ monto: 500000, retefuente: 0, ica: 0 }];
    expect(estadoCobro(cuenta, pagos, "2026-11-20")).toEqual({
      estado: "abonado",
      vencido: true,
    });
  });
});
