"use server";

import { revalidatePath } from "next/cache";
import { validarGasto, type GastoEntrada } from "@/lib/gastos";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type Resultado = { ok: true; viajeId: string | null } | { ok: false; error: string };

// Registra un gasto del camión, suelto o asociado a un viaje de ese mismo camión.
export async function registrarGasto(entrada: GastoEntrada): Promise<Resultado> {
  const validado = validarGasto(entrada);
  if (!validado.ok) return validado;

  const supabase = await crearClienteServidor();
  if (entrada.viajeId) {
    const { data: viaje } = await supabase.from("viajes").select("camion_id").eq("id", entrada.viajeId).maybeSingle();
    if (!viaje) return { ok: false, error: "No se encontró el viaje" };
    if (viaje.camion_id !== entrada.camionId) return { ok: false, error: "El viaje es de otro camión" };
  }

  const { error } = await supabase.from("gastos").insert(validado.datos);
  if (error) return { ok: false, error: "No se pudo guardar el gasto" };

  revalidatePath("/viajes", "layout");
  return { ok: true, viajeId: entrada.viajeId };
}
