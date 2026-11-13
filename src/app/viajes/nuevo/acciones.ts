"use server";

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { armarViaje, type ViajeEntrada } from "@/lib/viajes";

export type Resultado =
  | { ok: true; id: string }
  | { ok: false; error: string; duplicado?: boolean };

// Acción del servidor: valida, calcula la comisión y guarda el viaje completo
// llamando a la función crear_viaje (atómica) de la base de datos.
export async function crearViaje(entrada: ViajeEntrada): Promise<Resultado> {
  const supabase = await crearClienteServidor();

  // El porcentaje se lee de la base, no del formulario: el navegador no decide la comisión.
  const { data: conductor } = await supabase
    .from("conductores")
    .select("comision_pct")
    .eq("id", entrada.conductorId)
    .single();
  if (!conductor) return { ok: false, error: "No se encontró el conductor" };

  const armado = armarViaje(entrada, Number(conductor.comision_pct));
  if (!armado.ok) return armado;

  const { data, error } = await supabase.rpc("crear_viaje", { datos: armado.datos });
  if (error) {
    // 23505 = violación de unicidad: el manifiesto ya existe.
    if (error.code === "23505") return { ok: false, error: "Ese manifiesto ya está registrado", duplicado: true };
    return { ok: false, error: "No se pudo guardar el viaje" };
  }
  return { ok: true, id: data as string };
}
