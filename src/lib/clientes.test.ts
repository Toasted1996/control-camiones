import { describe, expect, it } from "vitest";
import { claveNombre, normalizarNombre } from "./clientes";

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
