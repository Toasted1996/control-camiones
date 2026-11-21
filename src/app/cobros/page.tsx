import Link from "next/link";
import { formatoCOP } from "@/dominio/dinero";
import { hoyBogota } from "@/lib/hoy";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { resumirCobros, SELECT_COBRO } from "@/lib/consultas-cobros";

const FILTROS = [
  { valor: "pendientes", texto: "Pendientes" },
  { valor: "vencidas", texto: "Vencidas" },
  { valor: "pagadas", texto: "Pagadas" },
  { valor: "todas", texto: "Todas" },
];
const TEXTO_ESTADO = { sin_cobrar: "Sin cobrar", cobrado: "Cobrado", abonado: "Abonado", pagado: "Pagado" };

// Cobros: cuentas ya emitidas, con lo que falta por cobrar y lo vencido. Por defecto solo las
// pendientes; "Pagadas" y "Todas" sirven de historial.
export default async function Cobros({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f = "pendientes" } = await searchParams;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("cuentas_cobro").select(SELECT_COBRO).eq("emitida", true).order("vence");
  if (error) throw new Error(error.message);

  const { items, porCobrar, vencido } = resumirCobros(data ?? [], hoyBogota());
  const visibles = items.filter(
    (c) => f === "todas" || (f === "pagadas" ? c.estado === "pagado" : f === "vencidas" ? c.vencido : c.saldo > 0),
  );

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-semibold">Cobros</h1>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-tinta/70">Por cobrar</p>
          <p className="text-lg font-bold">{formatoCOP(porCobrar)}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-tinta/70">Vencido</p>
          <p className={`text-lg font-bold ${vencido > 0 ? "text-red-700" : ""}`}>{formatoCOP(vencido)}</p>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto">
        {FILTROS.map((x) => (
          <Link
            key={x.valor}
            href={`/cobros?f=${x.valor}`}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
              f === x.valor ? "bg-primario text-white" : "bg-white text-tinta/70"
            }`}
          >
            {x.texto}
          </Link>
        ))}
      </div>

      {visibles.length === 0 && <p className="text-center text-tinta/70">No hay cuentas en esta lista.</p>}
      <ul className="space-y-3">
        {visibles.map((c) => (
          <li key={c.id} className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
            <Link href={`/viajes/${c.viajeId}`} className="block space-y-1">
              <p className="flex justify-between">
                <span className="font-semibold">{c.cliente}</span>
                <span className="font-semibold">{formatoCOP(c.saldo)}</span>
              </p>
              <p className="text-sm text-tinta/70">
                {c.placa} · {c.sentido === "ida" ? "Ida" : "Regreso"} · {TEXTO_ESTADO[c.estado]}
              </p>
              <p className="text-sm text-tinta/70">Vence {c.vence}</p>
            </Link>
            {c.vencido && (
              <p className="text-sm font-semibold text-red-700">
                Vencida hace {c.diasVencida} {c.diasVencida === 1 ? "día" : "días"} · te avisamos cada 3 días
              </p>
            )}
            {c.saldo > 0 && (
              <Link
                href={`/pagos/nuevo?cuenta=${c.id}`}
                className="block rounded-lg border border-primario px-3 py-2 text-center text-sm font-semibold text-primario"
              >
                Registrar pago
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
