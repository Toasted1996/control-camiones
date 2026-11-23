import Link from "next/link";
import { formatoCOP } from "@/dominio/dinero";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { resumirViaje, SELECT_VIAJE_LISTA } from "@/lib/consultas-viajes";

const FILTROS = [
  { valor: "", texto: "Todos" },
  { valor: "sin_cobrar", texto: "Sin cobrar" },
  { valor: "cobrado", texto: "Cobrado" },
  { valor: "abonado", texto: "Abonado" },
  { valor: "pagado", texto: "Pagado" },
];
const TEXTO_ESTADO = { sin_cobrar: "Sin cobrar", cobrado: "Cobrado", abonado: "Abonado", pagado: "Pagado" };

const PAGINA = 20;
const MAX = 500;

// Lista de viajes: busca por manifiesto o cliente y filtra por estado de cobro, todo en la base
// (vista viajes_lista). Trae de a 20, los más recientes primero; "Ver más" sube el tope (n).
export default async function Viajes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string; n?: string }>;
}) {
  const { q = "", f = "", n } = await searchParams;
  const tope = Math.min(MAX, Math.max(PAGINA, Number(n) || PAGINA));
  const supabase = await crearClienteServidor();

  // Los símbolos de la sintaxis de filtros de PostgREST se quitan del texto buscado.
  const busca = q.trim().replace(/[,()%*\\]/g, " ");
  let lista = supabase.from("viajes_lista").select("id").order("fecha", { ascending: false }).order("creado_en", { ascending: false });
  if (f) lista = lista.eq("estado", f);
  if (busca) lista = lista.or(`cliente.ilike.%${busca}%,manifiestos.ilike.%${busca}%`);
  // Se pide uno de más para saber si hay más viajes que mostrar.
  const ids = await lista.limit(tope + 1);
  if (ids.error) throw new Error(ids.error.message);
  const hayMas = ids.data.length > tope;
  const orden = ids.data.slice(0, tope).map((x: { id: string }) => x.id);

  // El detalle de esos viajes (tramos, pagos) se pide aparte, solo de los que se muestran.
  const detalle = orden.length
    ? await supabase.from("viajes").select(SELECT_VIAJE_LISTA).in("id", orden)
    : { data: [], error: null };
  if (detalle.error) throw new Error(detalle.error.message);
  const porId = new Map((detalle.data ?? []).map((fila) => [(fila as unknown as { id: string }).id, resumirViaje(fila)]));
  const viajes = orden.flatMap((id) => porId.get(id) ?? []);

  const enlace = (filtro: string) => `/viajes?${new URLSearchParams({ q, f: filtro })}`;

  return (
    <main className="mx-auto w-full max-w-md p-4 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Viajes</h1>
        <Link href="/viajes/nuevo" className="rounded-lg bg-primario px-3 py-2 text-sm font-semibold text-white">
          Nuevo viaje
        </Link>
      </div>

      <form className="mb-3">
        <input type="hidden" name="f" value={f} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar manifiesto o cliente"
          className="w-full rounded-lg border border-black/20 bg-white px-3 py-3"
        />
      </form>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {FILTROS.map((x) => (
          <Link
            key={x.valor}
            href={enlace(x.valor)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
              f === x.valor ? "bg-primario text-white" : "bg-white text-tinta/70"
            }`}
          >
            {x.texto}
          </Link>
        ))}
      </div>

      {viajes.length === 0 && <p className="text-center text-tinta/70">No hay viajes.</p>}
      <ul className="space-y-3">
        {viajes.map((v) => (
          <li key={v.id}>
            <Link href={`/viajes/${v.id}`} className="block space-y-1 rounded-lg bg-white p-4 shadow-sm">
              <p className="flex justify-between">
                <span className="font-semibold">{v.cliente.nombre}</span>
                <span className="text-sm text-tinta/70">{v.fecha}</span>
              </p>
              <p className="text-sm text-tinta/70">
                {v.placa} · {v.tramos.map((t) => t.manifiesto).join(" / ")}
              </p>
              <p className="flex justify-between text-sm">
                <span>{TEXTO_ESTADO[v.estado]}</span>
                <span className="font-semibold">
                  {v.estado === "pagado" ? formatoCOP(v.total) : `Saldo ${formatoCOP(v.saldo)}`}
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {hayMas && (
        <Link
          href={`/viajes?${new URLSearchParams({ q, f, n: String(tope + PAGINA) })}`}
          className="mt-4 block rounded-lg border border-primario px-3 py-3 text-center font-semibold text-primario"
        >
          Ver más viajes
        </Link>
      )}
    </main>
  );
}
