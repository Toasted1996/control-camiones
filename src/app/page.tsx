import Placa from "@/components/Placa";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Inicio: por ahora lista los camiones. Sirve también para comprobar que
// un usuario con sesión lee la tabla (RLS) y que el servidor ve la sesión.
export default async function Inicio() {
  const supabase = await crearClienteServidor();
  const { data: camiones, error } = await supabase
    .from("camiones")
    .select("id, placa, nombre")
    .order("placa");

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Inicio</h1>
      {error && <p role="alert" className="text-sm text-red-700">No se pudieron cargar los camiones</p>}
      <ul className="space-y-2">
        {camiones?.map((c, i) => (
          <li key={c.id} className="flex flex-col items-center gap-1 rounded-lg bg-white px-4 py-3 shadow-sm">
            <Placa placa={c.placa} indice={i} />
            {c.nombre && <span className="text-sm text-tinta/70">{c.nombre}</span>}
          </li>
        ))}
      </ul>
    </main>
  );
}
