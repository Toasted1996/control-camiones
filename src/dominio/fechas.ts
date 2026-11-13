// Fecha ISO `dias` días después de `fecha` (UTC, sin saltos por horario).
export function sumarDias(fecha: string, dias: number): string {
  return new Date(Date.parse(fecha) + dias * 86_400_000).toISOString().slice(0, 10);
}

// Días enteros de `a` a `b` (fechas ISO YYYY-MM-DD).
// Positivo si b es posterior a a; negativo si es anterior.
export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}
