import Link from "next/link";
import { formatoCOP } from "@/dominio/dinero";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { resumirViaje, SELECT_VIAJE } from "@/lib/consultas-viajes";

const FILTROS = [
  { valor: "", texto: "Todos" },
  { valor: "sin_cobrar", texto: "Sin cobrar" },
  { valor: "abonado", texto: "Abonado" },
  { valor: "pagado", texto: "Pagado" },
];
const TEXTO_ESTADO = { sin_cobrar: "Sin cobrar", abonado: "Abonado", pagado: "Pagado" };

// Lista de viajes: busca por manifiesto o cliente y filtra por estado de cobro.
// Son pocos viajes (3 camiones), así que se trae todo y se filtra aquí.
export default async function Viajes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  const { q = "", f = "" } = await searchParams;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("viajes").select(SELECT_VIAJE).order("fecha", { ascending: false });

  const busca = q.trim().toLowerCase();
  const viajes = (data ?? [])
    .map(resumirViaje)
    .filter((v) => !f || v.estado === f)
    .filter(
      (v) =>
        !busca ||
        v.cliente.nombre.toLowerCase().includes(busca) ||
        v.tramos.some((t) => t.manifiesto.toLowerCase().includes(busca)),
    );

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
    </main>
  );
}
