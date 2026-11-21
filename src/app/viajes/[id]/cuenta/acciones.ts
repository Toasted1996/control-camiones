"use server";

import { revalidatePath } from "next/cache";
import { documentoDe, resumirViaje, SELECT_VIAJE, type DatosPago } from "@/lib/consultas-viajes";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const CAMPOS = ["quien", "nit", "direccion", "telefono", "banco", "tipoCuenta", "numero"] as const;

// Emite la cuenta de cobro: arma el documento completo desde la base de datos (el navegador solo
// aporta los datos de quien cobra) y lo guarda con emitir_cuenta, que le fija emisión y vencimiento.
// Si ya estaba emitida, no cambia nada.
export async function emitirCuenta(
  viajeId: string,
  datos: DatosPago,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Solo se guardan los campos esperados, como texto recortado y de largo acotado.
  const limpios = Object.fromEntries(
    CAMPOS.map((k) => [k, String(datos[k] ?? "").trim().slice(0, 200)]),
  ) as DatosPago;

  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("viajes").select(SELECT_VIAJE).eq("id", viajeId).maybeSingle();
  if (!data) return { ok: false, error: "No se encontró el viaje" };

  const documento = documentoDe(resumirViaje(data), limpios);
  const { data: emitida, error } = await supabase.rpc("emitir_cuenta", { p_viaje: viajeId, p_documento: documento });
  if (error) return { ok: false, error: "No se pudo emitir la cuenta de cobro" };
  revalidatePath(`/viajes/${viajeId}`, "layout");
  revalidatePath("/viajes");
  revalidatePath("/cobros");
  // false = ya estaba emitida (p. ej. otra pestaña): no se cambia nada y se muestra la guardada.
  if (emitida === false) return { ok: false, error: "Esta cuenta ya estaba emitida; se muestra la guardada" };
  return { ok: true };
}
