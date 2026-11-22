import FondoCarretera from "@/components/FondoCarretera";
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
    // -mb-16 + pb-16: la carretera llega hasta el borde inferior, bajo el relleno que deja el layout
    // para el distintivo de Netlify.
    <div className="relative -mb-16 flex flex-1 flex-col overflow-hidden pb-16">
      <FondoCarretera />
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
        <h1 className="text-2xl font-semibold">Inicio</h1>
        {error && <p role="alert" className="text-sm text-red-700">No se pudieron cargar los camiones</p>}
        {/* my-auto centra las placas en el espacio que queda bajo el título, en cualquier alto de pantalla. */}
        <ul className="my-auto space-y-6">
          {camiones?.map((c, i) => (
            <li key={c.id} className="flex flex-col items-center gap-1">
              <Placa placa={c.placa} indice={i} grande />
              {c.nombre && <span className="text-sm text-tinta/70">{c.nombre}</span>}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
