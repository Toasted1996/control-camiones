export type PagoEntrada = {
  cuentaId: string;
  fecha: string; // ISO yyyy-mm-dd
  monto: number; // dinero recibido, pesos enteros
  tipo: string; // abono | saldo
  retefuente: number;
  ica: number;
};

// Valida el pago y arma la fila para `pagos`. `saldo` es lo que aún debe la cuenta (saldoCuenta):
// el pago completo (monto + retenciones) no puede pasarlo.
export function validarPago(e: PagoEntrada, saldo: number) {
  const error = (mensaje: string) => ({ ok: false as const, error: mensaje });

  if (!e.cuentaId) return error("Falta la cuenta de cobro");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.fecha)) return error("La fecha no es válida");
  if (e.tipo !== "abono" && e.tipo !== "saldo") return error("El tipo de pago no es válido");
  for (const n of [e.monto, e.retefuente, e.ica]) {
    if (!Number.isInteger(n) || n < 0) return error("Los valores deben ser pesos enteros, sin negativos");
  }
  const total = e.monto + e.retefuente + e.ica;
  if (total <= 0) return error("El pago debe ser mayor que cero");
  if (total > saldo) return error("El pago supera el saldo de la cuenta");

  return {
    ok: true as const,
    datos: {
      cuenta_id: e.cuentaId,
      fecha: e.fecha,
      monto: e.monto,
      tipo: e.tipo,
      retefuente: e.retefuente,
      ica: e.ica,
    },
  };
}
