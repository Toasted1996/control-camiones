// Formateador de pesos colombianos: sin decimales y con punto de miles.
const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// Convierte un entero de pesos en texto para mostrar, p. ej. 1200000 → "$ 1.200.000".
export function formatoCOP(n: number): string {
  return cop.format(n);
}
