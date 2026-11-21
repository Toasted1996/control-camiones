"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { armarViaje, type ViajeEntrada } from "@/lib/viajes";

export type Resultado =
  | { ok: true; id: string; clienteNuevo: boolean }
  | { ok: false; error: string; duplicado?: boolean };

// Acción del servidor: valida, calcula la comisión, busca o crea la empresa y guarda el viaje completo
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

  // Se valida todo antes de tocar la base, para no crear empresas por un formulario con errores.
  const armado = armarViaje(entrada, Number(conductor.comision_pct));
  if (!armado.ok) return armado;

  // La empresa se normaliza y se reutiliza si ya existe (buscar_o_crear_cliente, migración 0007).
  const { data: cliente, error: errorCliente } = await supabase
    .rpc("buscar_o_crear_cliente", { p_nombre: entrada.cliente })
    .single<{ cliente_id: string; creado: boolean }>();
  if (errorCliente || !cliente) return { ok: false, error: "No se pudo guardar la empresa" };

  const { data, error } = await supabase.rpc("crear_viaje", {
    datos: { ...armado.datos, cliente_id: cliente.cliente_id },
  });
  if (error) {
    // 23505 = violación de unicidad: el manifiesto ya existe.
    if (error.code === "23505") return { ok: false, error: "Ese manifiesto ya está registrado", duplicado: true };
    return { ok: false, error: "No se pudo guardar el viaje" };
  }
  // Una empresa nueva debe aparecer en las sugerencias del formulario.
  if (cliente.creado) revalidatePath("/viajes/nuevo");
  return { ok: true, id: data as string, clienteNuevo: cliente.creado };
}
