"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Emite la cuenta de cobro del viaje (fecha de emisión y vencimiento) con la
// función emitir_cuenta de la base de datos. Si ya estaba emitida, no cambia nada.
export async function emitirCuenta(viajeId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("emitir_cuenta", { p_viaje: viajeId });
  if (error) return { ok: false, error: "No se pudo emitir la cuenta de cobro" };
  revalidatePath(`/viajes/${viajeId}`, "layout");
  revalidatePath("/viajes");
  return { ok: true };
}
