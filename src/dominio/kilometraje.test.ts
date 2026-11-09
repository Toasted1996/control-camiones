import { describe, expect, it } from "vitest";
import { kmActual, kmPorSemana, sugerirAceite } from "./kilometraje";

describe("kmPorSemana", () => {
  it("null con menos de 2 lecturas", () => {
    expect(kmPorSemana([])).toBeNull();
    expect(kmPorSemana([{ fecha: "2026-11-01", km: 1000 }])).toBeNull();
  });

  it("null si el rango es menor de 7 días", () => {
    const l = [
      { fecha: "2026-11-01", km: 1000 },
      { fecha: "2026-11-07", km: 1500 },
    ];
    expect(kmPorSemana(l)).toBeNull();
  });

  it("exactamente 7 días ya calcula", () => {
    const l = [
      { fecha: "2026-11-01", km: 1000 },
      { fecha: "2026-11-08", km: 1700 },
    ];
    expect(kmPorSemana(l)).toBe(700);
  });

  it("14 días: promedio semanal, sin importar el orden", () => {
    const l = [
      { fecha: "2026-11-15", km: 2400 },
      { fecha: "2026-11-01", km: 1000 },
    ];
    expect(kmPorSemana(l)).toBe(700);
  });
});

describe("kmActual", () => {
  it("devuelve el mayor km", () => {
    const l = [
      { fecha: "2026-11-01", km: 1000 },
      { fecha: "2026-11-08", km: 1700 },
      { fecha: "2026-11-05", km: 1400 },
    ];
    expect(kmActual(l)).toBe(1700);
  });
});

describe("sugerirAceite", () => {
  const base = { ultimoAceiteKm: 100000, cadaKm: 10000 };

  it("lejos del cambio: no sugiere", () => {
    const r = sugerirAceite({ ...base, kmActual: 105000 });
    expect(r.sugerir).toBe(false);
    expect(r.kmRestantes).toBe(5000);
  });

  it("justo en el margen (1000 km): sugiere", () => {
    const r = sugerirAceite({ ...base, kmActual: 109000 });
    expect(r.sugerir).toBe(true);
    expect(r.mensaje).toBe("Conviene revisar el aceite pronto (~1000 km estimados)");
  });

  it("un km antes del margen: no sugiere", () => {
    expect(sugerirAceite({ ...base, kmActual: 108999 }).sugerir).toBe(false);
  });

  it("pasado de km: sugiere y no muestra km negativos", () => {
    const r = sugerirAceite({ ...base, kmActual: 111000 });
    expect(r.sugerir).toBe(true);
    expect(r.kmRestantes).toBe(-1000);
    expect(r.mensaje).toContain("~0 km");
  });

  it("el mensaje nunca ordena cambiar ni dice ahora", () => {
    for (const km of [109000, 110000, 120000]) {
      const m = sugerirAceite({ ...base, kmActual: km }).mensaje.toLowerCase();
      expect(m).not.toContain("cambiar");
      expect(m).not.toContain("ahora");
    }
  });

  it("margen editable", () => {
    const r = sugerirAceite({ ...base, kmActual: 105000, margenKm: 5000 });
    expect(r.sugerir).toBe(true);
  });
});
