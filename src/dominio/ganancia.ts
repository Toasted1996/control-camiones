// Ganancia real de un camión: lo que facturó (viajes, sin esperar a cobrarlos) menos la comisión de
// los conductores y los gastos (combustible, peajes y otros). Los mantenimientos se sumarán a los
// gastos cuando existan.
export function gananciaReal(ingresos: number, comisiones: number, gastos: number): number {
  return ingresos - comisiones - gastos;
}
