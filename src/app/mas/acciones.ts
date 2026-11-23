"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_INICIO } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Cierra la sesión en Supabase (borra sus cookies) y la marca de inicio de sesión.
export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  (await cookies()).delete(COOKIE_INICIO);
  redirect("/ingreso");
}
