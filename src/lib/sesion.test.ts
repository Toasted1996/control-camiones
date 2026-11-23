import { describe, expect, it } from "vitest";
import { DURACION_SESION_MS, sesionVencida } from "./sesion";

describe("sesionVencida", () => {
  const ahora = 1_800_000_000_000;
  it("dentro de los 10 días sigue vigente", () => {
    expect(sesionVencida(String(ahora - DURACION_SESION_MS + 1000), ahora)).toBe(false);
  });
  it("pasados los 10 días vence", () => {
    expect(sesionVencida(String(ahora - DURACION_SESION_MS - 1000), ahora)).toBe(true);
  });
  it("sin marca o con basura se considera vencida", () => {
    expect(sesionVencida(undefined, ahora)).toBe(true);
    expect(sesionVencida("abc", ahora)).toBe(true);
  });
});
