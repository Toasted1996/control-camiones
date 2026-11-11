import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase para componentes del navegador. Usa solo la clave anon:
// lo que puede leer lo decide RLS según la sesión del usuario.
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
