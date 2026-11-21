import { hoyBogota } from "@/lib/hoy";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import FormularioViaje from "./FormularioViaje";

// Página del servidor: carga las listas (camiones, conductores, clientes) y
// se las pasa al formulario, que es un componente de cliente interactivo.
export default async function NuevoViaje() {
  const supabase = await crearClienteServidor();
  const [camiones, conductores, clientes] = await Promise.all([
    supabase.from("camiones").select("id, placa").eq("activo", true).order("placa"),
    supabase
      .from("conductores")
      .select("id, nombre, comision_pct, camion_id")
      .eq("activo", true)
      .order("nombre"),
    supabase.from("clientes").select("id, nombre").order("nombre"),
  ]);

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <h1 className="mb-4 text-2xl font-semibold">Nuevo viaje</h1>
      <FormularioViaje
        camiones={camiones.data ?? []}
        conductores={conductores.data ?? []}
        clientes={clientes.data ?? []}
        hoy={hoyBogota()}
      />
    </main>
  );
}
