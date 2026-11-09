import { describe, expect, it } from "vitest";
import { calcularAlertas, diasEntre, type EntradaAlertas } from "./alertas";

const vacio: EntradaAlertas = { cuentas: [], papeles: [], camiones: [] };
const HOY = "2026-11-15";

describe("diasEntre", () => {
  it("cuenta días de a hacia b", () => {
    expect(diasEntre("2026-11-01", "2026-11-15")).toBe(14);
    expect(diasEntre("2026-11-15", "2026-11-01")).toBe(-14);
    expect(diasEntre("2026-11-15", "2026-11-15")).toBe(0);
  });

  it("cruza fin de mes y de año", () => {
    expect(diasEntre("2026-12-30", "2027-01-02")).toBe(3);
  });
});

describe("alertas de deuda", () => {
  const cuenta = (o: object) => ({
    titulo: "Cuenta 001",
    saldo: 500000,
    vence: "2026-11-10",
    ...o,
  });
  const run = (o: object) =>
    calcularAlertas({ ...vacio, cuentas: [cuenta(o)] }, HOY).filter((a) => a.tipo === "deuda");

  it("vencida y nunca avisada: avisa", () => {
    expect(run({})).toHaveLength(1);
  });

  it("no vencida (vence hoy): no avisa", () => {
    expect(run({ vence: HOY })).toHaveLength(0);
  });

  it("saldo 0: no avisa", () => {
    expect(run({ saldo: 0 })).toHaveLength(0);
  });

  it("último aviso hace exactamente 3 días: avisa", () => {
    expect(run({ ultimoAviso: "2026-11-12" })).toHaveLength(1);
  });

  it("último aviso hace 2 días: no avisa", () => {
    expect(run({ ultimoAviso: "2026-11-13" })).toHaveLength(0);
  });
});

describe("alertas de papeles", () => {
  const papel = (o: object) => ({
    titulo: "SOAT",
    vence: "2026-12-15",
    completado: false,
    ...o,
  });
  const run = (o: object) =>
    calcularAlertas({ ...vacio, papeles: [papel(o)] }, HOY).filter((a) => a.tipo === "papel");

  it("faltan exactamente 30 días: avisa", () => {
    expect(run({})).toHaveLength(1);
  });

  it("faltan 31 días: no avisa", () => {
    expect(run({ vence: "2026-12-16" })).toHaveLength(0);
  });

  it("papel ya vencido: avisa", () => {
    const r = run({ vence: "2026-11-10" });
    expect(r).toHaveLength(1);
    expect(r[0].detalle).toContain("Venció hace 5 días");
  });

  it("renovado (completado): no avisa", () => {
    expect(run({ vence: "2026-11-10", completado: true })).toHaveLength(0);
  });

  it("último aviso hace exactamente 7 días: avisa", () => {
    expect(run({ ultimoAviso: "2026-11-08" })).toHaveLength(1);
  });

  it("último aviso hace 6 días: no avisa", () => {
    expect(run({ ultimoAviso: "2026-11-09" })).toHaveLength(0);
  });
});

describe("alertas de camión", () => {
  const camion = (o: object) => ({
    nombre: "ABC123",
    kmActual: 100000,
    ultimaLectura: "2026-11-10",
    ...o,
  });
  const run = (o: object) =>
    calcularAlertas({ ...vacio, camiones: [camion(o)] }, HOY);

  it("lectura de hace 15 días: no pide actualizar", () => {
    expect(run({ ultimaLectura: "2026-10-31" }).filter((a) => a.tipo === "km")).toHaveLength(0);
  });

  it("lectura de hace 16 días: pide actualizar", () => {
    expect(run({ ultimaLectura: "2026-10-30" }).filter((a) => a.tipo === "km")).toHaveLength(1);
  });

  it("aceite cerca del cambio: sugiere revisar", () => {
    const r = run({ ultimoAceiteKm: 91000, cadaKm: 10000 }).filter((a) => a.tipo === "aceite");
    expect(r).toHaveLength(1);
    expect(r[0].detalle).toContain("revisar el aceite");
  });

  it("sin datos de aceite: no genera alerta", () => {
    expect(run({}).filter((a) => a.tipo === "aceite")).toHaveLength(0);
  });
});

describe("sin datos", () => {
  it("no genera alertas", () => {
    expect(calcularAlertas(vacio, HOY)).toEqual([]);
  });
});
