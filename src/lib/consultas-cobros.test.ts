import { describe, expect, it } from "vitest";
import { resumirCobros } from "./consultas-cobros";

const cuenta = (id: string, total: number, vence: string, pagos: { monto: number; retefuente: number; ica: number }[]) => ({
  id,
  total,
  emitida: true,
  fecha_emision: "2026-10-01",
  vence,
  tramos: { sentido: "ida", manifiesto: id, viaje_id: "v" + id, viajes: { clientes: { nombre: "Andina" }, camiones: { placa: "ABC123" } } },
  pagos,
});

describe("resumirCobros", () => {
  const hoy = "2026-11-20";
  const r = resumirCobros(
    [
      cuenta("1", 1_000_000, "2026-11-10", [{ monto: 400_000, retefuente: 0, ica: 0 }]), // vencida, saldo 600.000
      cuenta("2", 500_000, "2026-12-01", []), // vigente, saldo 500.000
      cuenta("3", 300_000, "2026-11-01", [{ monto: 296_000, retefuente: 3_000, ica: 1_000 }]), // pagada con retenciones, saldo 0
    ],
    hoy,
  );

  it("suma lo que falta por cobrar", () => expect(r.porCobrar).toBe(1_100_000));
  it("suma solo lo vencido con saldo (una pagada no cuenta)", () => expect(r.vencido).toBe(600_000));
  it("una cuenta pagada queda en saldo 0 y estado pagado", () => {
    expect(r.items[2]).toMatchObject({ saldo: 0, estado: "pagado", vencido: false });
  });
  it("marca días de vencida y estado", () => {
    expect(r.items[0]).toMatchObject({ vencido: true, diasVencida: 10, estado: "abonado", saldo: 600_000 });
    expect(r.items[1]).toMatchObject({ vencido: false, estado: "cobrado" });
  });
});
