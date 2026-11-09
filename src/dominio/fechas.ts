// Días enteros de `a` a `b` (fechas ISO YYYY-MM-DD).
// Positivo si b es posterior a a; negativo si es anterior.
export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}
