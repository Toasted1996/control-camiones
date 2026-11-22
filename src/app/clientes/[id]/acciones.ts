"use server";

import { revalidatePath } from "next/cache";
import { validarCliente, type ClienteEntrada } from "@/lib/clientes";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type Resultado = { ok: true } | { ok: false; error: string };

// Guarda el plazo, las retenciones y el contacto de un cliente. El nombre no se edita aquí. Los
// cambios aplican a las cuentas que se emitan y a los pagos que se registren después; las ya
// emitidas conservan su vencimiento.
export async function actualizarCliente(id: string, entrada: ClienteEntrada): Promise<Resultado> {
  const validado = validarCliente(entrada);
  if (!validado.ok) return validado;

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("clientes").update(validado.datos).eq("id", id).select("id");
  if (error) return { ok: false, error: "No se pudo guardar el cliente" };
  if (!data?.length) return { ok: false, error: "No se encontró el cliente" };

  revalidatePath("/clientes", "layout");
  return { ok: true };
}
