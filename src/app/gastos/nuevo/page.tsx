import { hoyBogota } from "@/lib/hoy";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { uno } from "@/lib/uno";
import FormularioGasto from "./FormularioGasto";

// Nuevo gasto. Con ?viaje=ID el gasto queda asociado a ese viaje (y a su camión); sin él, el gasto
// es del camión que se elija y se puede asociar opcionalmente a uno de sus viajes recientes.
export default async function NuevoGasto({ searchParams }: { searchParams: Promise<{ viaje?: string }> }) {
  const { viaje: viajeId } = await searchParams;
  const supabase = await crearClienteServidor();
  const [camiones, viajes] = await Promise.all([
    supabase.from("camiones").select("id, placa").eq("activo", true).order("placa"),
    supabase
      .from("viajes")
      .select("id, fecha, camion_id, clientes(nombre)")
      .order("fecha", { ascending: false })
      .limit(40),
  ]);
  if (camiones.error) throw new Error(camiones.error.message);
  if (viajes.error) throw new Error(viajes.error.message);

  const lista = viajes.data.map((v) => ({
    id: v.id as string,
    camionId: v.camion_id as string,
    texto: `${v.fecha} · ${uno(v.clientes).nombre}`,
  }));
  // Un viaje pedido por enlace puede ser anterior a los 40 recientes: se busca aparte.
  const elegido = viajeId && !lista.some((v) => v.id === viajeId)
    ? (await supabase.from("viajes").select("id, fecha, camion_id, clientes(nombre)").eq("id", viajeId).maybeSingle()).data
    : null;
  if (elegido) lista.push({ id: elegido.id, camionId: elegido.camion_id, texto: `${elegido.fecha} · ${uno(elegido.clientes).nombre}` });

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-semibold">Nuevo gasto</h1>
      <FormularioGasto
        camiones={camiones.data}
        viajes={lista}
        viajeInicial={lista.find((v) => v.id === viajeId) ?? null}
        hoy={hoyBogota()}
      />
    </main>
  );
}
