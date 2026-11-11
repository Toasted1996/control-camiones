import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente de Supabase para páginas y acciones del servidor. Lee la sesión
// de las cookies de la petición; sin eso RLS vería al usuario como anónimo.
export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return almacen.getAll();
        },
        setAll(cookiesParaGuardar) {
          try {
            cookiesParaGuardar.forEach(({ name, value, options }) =>
              almacen.set(name, value, options),
            );
          } catch {
            // Desde una página de servidor no se pueden escribir cookies;
            // proxy.ts ya renueva la sesión.
          }
        },
      },
    },
  );
}
