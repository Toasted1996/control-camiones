import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Guardián de rutas: refresca la sesión de Supabase en cada petición y manda a
// /ingreso a quien no haya iniciado sesión (y fuera de /ingreso a quien sí).
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookies) {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser valida el token con Supabase (getSession solo lee la cookie).
  const { data: { user } } = await supabase.auth.getUser();
  const enIngreso = request.nextUrl.pathname === "/ingreso";

  if (!user && !enIngreso) {
    return NextResponse.redirect(new URL("/ingreso", request.url));
  }
  if (user && enIngreso) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return respuesta;
}

// No se protege lo estático ni el cron (ese se protege con CRON_SECRET).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/cron|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|ico)$).*)",
  ],
};
