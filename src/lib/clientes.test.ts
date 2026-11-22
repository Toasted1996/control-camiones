import { describe, expect, it } from "vitest";
import { claveNombre, normalizarNombre, validarCliente } from "./clientes";

describe("nombre de empresa", () => {
  it("normaliza espacios y mayúsculas", () => {
    expect(normalizarNombre("  transportes   Andina s.a.s ")).toBe("TRANSPORTES ANDINA S.A.S");
  });
  it("conserva las tildes al normalizar", () => {
    expect(normalizarNombre("Ándina")).toBe("ÁNDINA");
  });
  it("la clave ignora tildes y mayúsculas, pero no la Ñ", () => {
    expect(claveNombre("Ándina  norte")).toBe(claveNombre("ANDINA NORTE"));
    expect(claveNombre("Ñandú")).toBe("ÑANDU");
    expect(claveNombre("Nandu")).not.toBe(claveNombre("Ñandu"));
  });
});

describe("validarCliente", () => {
  const base = { contacto: " Ana ", plazo: "30", retefuente: "1", ica: "4,14" };

  it("acepta los datos y acepta coma decimal", () => {
    expect(validarCliente(base)).toEqual({
      ok: true,
      datos: { contacto: "Ana", plazo_dias: 30, retefuente_pct: 1, ica_por_mil: 4.14 },
    });
  });
  it("plazo y contacto vacíos significan sin plazo y sin contacto", () => {
    expect(validarCliente({ ...base, contacto: " ", plazo: "" })).toMatchObject({
      ok: true,
      datos: { contacto: null, plazo_dias: null },
    });
  });
  it("acepta plazo 0 y punto decimal", () => {
    expect(validarCliente({ ...base, plazo: "0", retefuente: "3.5" })).toMatchObject({
      ok: true,
      datos: { plazo_dias: 0, retefuente_pct: 3.5 },
    });
  });
  it.each([
    ["plazo negativo", { ...base, plazo: "-1" }],
    ["plazo con decimales", { ...base, plazo: "1.5" }],
    ["plazo muy largo", { ...base, plazo: "400" }],
    ["plazo con letras", { ...base, plazo: "treinta" }],
    ["retefuente vacía", { ...base, retefuente: "" }],
    ["retefuente sobre 100", { ...base, retefuente: "101" }],
    ["ica con letras", { ...base, ica: "abc" }],
    ["ica negativo", { ...base, ica: "-4" }],
  ])("rechaza: %s", (_nombre, entrada) => {
    expect(validarCliente(entrada).ok).toBe(false);
  });
});
