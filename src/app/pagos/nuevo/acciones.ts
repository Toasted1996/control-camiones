"use server";

import { revalidatePath } from "next/cache";
import { saldoCuenta } from "@/dominio/cobros";
import { validarPago, type PagoEntrada } from "@/lib/pagos";
import { uno } from "@/lib/uno";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type Resultado = { ok: true; viajeId: string } | { ok: false; error: string };

// Registra un pago en una cuenta de cobro. El saldo se calcula aquí con saldoCuenta a partir de la
// base de datos: el navegador no decide cuánto se debe.
export async function registrarPago(entrada: PagoEntrada): Promise<Resultado> {
  const supabase = await crearClienteServidor();

  const { data: cuenta } = await supabase
    .from("cuentas_cobro")
    .select("total, tramos(viaje_id), pagos(monto, retefuente, ica)")
    .eq("id", entrada.cuentaId)
    .maybeSingle();
  if (!cuenta) return { ok: false, error: "No se encontró la cuenta de cobro" };

  const validado = validarPago(entrada, saldoCuenta(cuenta.total, cuenta.pagos));
  if (!validado.ok) return validado;

  const { error } = await supabase.from("pagos").insert(validado.datos);
  if (error) return { ok: false, error: "No se pudo guardar el pago" };

  revalidatePath("/viajes", "layout");
  revalidatePath("/cobros");
  return { ok: true, viajeId: uno(cuenta.tramos).viaje_id };
}
