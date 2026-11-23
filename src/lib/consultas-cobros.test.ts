import { describe, expect, it } from "vitest";
import { resumirCobros, totalesCobro } from "./consultas-cobros";

// Filas como las entrega la vista cuentas_saldo: el saldo y la cantidad de pagos ya vienen calculados.
const cuenta = (id: string, total: number, vence: string, saldo: number, n_pagos: number) => ({
  id,
  total,
  emitida: true,
  fecha_emision: "2026-10-01",
  vence,
  saldo,
  n_pagos,
  tramos: { sentido: "ida", manifiesto: id, viaje_id: "v" + id, viajes: { clientes: { nombre: "Andina" }, camiones: { placa: "ABC123" } } },
});

const hoy = "2026-11-20";

describe("resumirCobros", () => {
  const r = resumirCobros(
    [
      cuenta("1", 1_000_000, "2026-11-10", 600_000, 1), // vencida, abonada
      cuenta("2", 500_000, "2026-12-01", 500_000, 0), // vigente, sin pagos
      cuenta("3", 300_000, "2026-11-01", 0, 1), // pagada (con retenciones)
    ],
    hoy,
  );

  it("una cuenta pagada queda en saldo 0 y estado pagado", () => {
    expect(r[2]).toMatchObject({ saldo: 0, estado: "pagado", vencido: false });
  });
  it("marca días de vencida y estado", () => {
    expect(r[0]).toMatchObject({ vencido: true, diasVencida: 10, estado: "abonado", saldo: 600_000 });
    expect(r[1]).toMatchObject({ vencido: false, estado: "cobrado" });
  });
});

describe("totalesCobro", () => {
  it("pasa la fila de la vista a números de la app", () => {
    expect(totalesCobro({ por_cobrar: 1_100_000, vencido: 600_000 })).toEqual({ porCobrar: 1_100_000, vencido: 600_000 });
  });
});
