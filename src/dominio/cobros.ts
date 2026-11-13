// Un pago registrado contra una cuenta de cobro: lo que entró más lo que el
// cliente retuvo (retefuente e ICA), porque esas retenciones también bajan la deuda.
export type Pago = { monto: number; retefuente: number; ica: number };

// Resultado de estadoCobro: en qué etapa va la cuenta y si además está vencida.
// "vencido" es una marca aparte, no un estado.
export type EstadoCobro = {
  estado: "sin_cobrar" | "cobrado" | "abonado" | "pagado";
  vencido: boolean;
};

// Define sobre qué monto se calcula la comisión del conductor: el bruto del tramo.
// Es la única función que decide esto; si la regla cambia, se cambia solo aquí.
export function baseComision(tramo: { monto: number }): number {
  return tramo.monto;
}

// Comisión del conductor: 24 % por defecto de la base, redondeada a pesos enteros.
export function comisionDe(tramo: { monto: number }, pct = 24): number {
  return Math.round((baseComision(tramo) * pct) / 100);
}

// Retención en la fuente: 1 % por defecto del total, a pesos enteros.
export function retefuente(total: number, pct = 1): number {
  return Math.round((total * pct) / 100);
}

// ICA: 4,14 por mil por defecto (= 0,414 %), a pesos enteros.
export function ica(total: number, porMil = 4.14): number {
  return Math.round((total * porMil) / 1000);
}

// Lo que aún se debe: total menos (monto + retefuente + ICA) de cada pago.
export function saldoCuenta(total: number, pagos: Pago[]): number {
  return total - pagos.reduce((s, p) => s + p.monto + p.retefuente + p.ica, 0);
}

// Etapa de un viaje para la lista: sin pagos → sin_cobrar; con pagos y saldo → abonado;
// saldo 0 → pagado. `pagado` incluye retenciones y anticipo (lo mismo que resta saldoCuenta).
export function estadoViaje(total: number, pagado: number): "sin_cobrar" | "abonado" | "pagado" {
  if (pagado >= total) return "pagado";
  return pagado > 0 ? "abonado" : "sin_cobrar";
}

// Etapa de la cuenta: sin emitir → sin_cobrar; emitida sin pagos → cobrado;
// con pagos y saldo → abonado; saldo 0 → pagado.
// Vencido: emitida, con saldo y con fecha de vencimiento ya pasada (el mismo día no cuenta).
export function estadoCobro(
  c: { emitida: boolean; total: number; vence: string },
  pagos: Pago[],
  hoy: string,
): EstadoCobro {
  const saldo = saldoCuenta(c.total, pagos);
  // Fechas ISO (YYYY-MM-DD): la comparación de texto equivale a la de fechas.
  const vencido = c.emitida && saldo > 0 && c.vence < hoy;
  if (!c.emitida) return { estado: "sin_cobrar", vencido };
  if (pagos.length === 0) return { estado: "cobrado", vencido };
  return { estado: saldo > 0 ? "abonado" : "pagado", vencido };
}
