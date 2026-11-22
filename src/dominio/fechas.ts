// Días enteros de `a` a `b` (fechas ISO YYYY-MM-DD).
// Positivo si b es posterior a a; negativo si es anterior.
export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

// Mes ("YYYY-MM") desplazado n meses: sumarMeses("2026-12", 1) → "2027-01".
export function sumarMeses(mes: string, n: number): string {
  const [a, m] = mes.split("-").map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

// Primer día del mes y primer día del mes siguiente, para filtrar fechas ISO con >= y <.
export function limitesMes(mes: string): { desde: string; hasta: string } {
  return { desde: `${mes}-01`, hasta: `${sumarMeses(mes, 1)}-01` };
}

// "2026-11" → "noviembre de 2026".
export const nombreMes = (mes: string) =>
  new Date(`${mes}-01T00:00:00Z`).toLocaleDateString("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });
