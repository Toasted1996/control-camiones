// Rendición del anticipo: lo que el conductor debe devolver al dueño.
// anticipo − gastos − comisión. Si da negativo, falta dinero (el conductor puso de más).
export function rendicionAnticipo(
  anticipo: number,
  gastos: number,
  comision: number,
): number {
  return anticipo - gastos - comision;
}
