import Link from "next/link";
import { notFound } from "next/navigation";
import Fila from "@/components/Fila";
import Placa from "@/components/Placa";
import { formatoCOP } from "@/dominio/dinero";
import { limitesMes, nombreMes, sumarMeses } from "@/dominio/fechas";
import { resumirMes, SELECT_GASTOS_MES, SELECT_VIAJES_MES } from "@/lib/consultas-camiones";
import { TIPOS_GASTO } from "@/lib/gastos";
import { hoyBogota } from "@/lib/hoy";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const VISTAS = [
  { valor: "resumen", texto: "Resumen" },
  { valor: "gastos", texto: "Gastos" },
];

// Detalle del camión en un mes: resumen con la ganancia real y lista de gastos. Los segmentos de
// mantenimientos y papeles llegan con la Tarea 8.
export default async function DetalleCamion({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string; vista?: string }>;
}) {
  const { id } = await params;
  const { mes: mesPedido, vista: vistaPedida } = await searchParams;
  const hoy = hoyBogota().slice(0, 7);
  const mes = mesPedido && /^\d{4}-(0[1-9]|1[0-2])$/.test(mesPedido) ? mesPedido : hoy;
  const vista = vistaPedida === "gastos" ? "gastos" : "resumen";
  const { desde, hasta } = limitesMes(mes);

  const supabase = await crearClienteServidor();
  const [camion, viajes, gastos] = await Promise.all([
    supabase.from("camiones").select("id, placa, nombre").eq("id", id).maybeSingle(),
    supabase.from("viajes").select(SELECT_VIAJES_MES).eq("camion_id", id).gte("fecha", desde).lt("fecha", hasta),
    supabase
      .from("gastos")
      .select(SELECT_GASTOS_MES)
      .eq("camion_id", id)
      .gte("fecha", desde)
      .lt("fecha", hasta)
      .order("fecha", { ascending: false }),
  ]);
  for (const r of [camion, viajes, gastos]) if (r.error) throw new Error(r.error.message);
  if (!camion.data) notFound();

  const r = resumirMes(viajes.data, gastos.data, id);
  const enlace = (m: string, v: string) => `/camiones/${id}?${new URLSearchParams({ mes: m, vista: v })}`;
  const texto = (tipo: string) => TIPOS_GASTO.find((t) => t.valor === tipo)?.texto ?? tipo;

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4 pb-24">
      <Link href="/" className="text-sm text-primario">← Inicio</Link>
      <div className="flex flex-col items-center gap-1">
        <Placa placa={camion.data.placa} />
        {camion.data.nombre && <span className="text-sm text-tinta/70">{camion.data.nombre}</span>}
      </div>

      <div className="flex items-center justify-between">
        <Link href={enlace(sumarMeses(mes, -1), vista)} aria-label="Mes anterior" className="px-3 py-2 text-primario">
          ‹
        </Link>
        <span className="font-semibold first-letter:uppercase">{nombreMes(mes)}</span>
        {mes < hoy ? (
          <Link href={enlace(sumarMeses(mes, 1), vista)} aria-label="Mes siguiente" className="px-3 py-2 text-primario">
            ›
          </Link>
        ) : (
          <span className="px-3 py-2 text-tinta/30">›</span>
        )}
      </div>

      <div className="flex rounded-lg bg-black/5 p-1">
        {VISTAS.map((x) => (
          <Link
            key={x.valor}
            href={enlace(mes, x.valor)}
            aria-current={vista === x.valor ? "page" : undefined}
            className={`flex-1 rounded-md py-2 text-center text-sm ${
              vista === x.valor ? "bg-white font-semibold shadow-sm" : "text-tinta/70"
            }`}
          >
            {x.texto}
          </Link>
        ))}
      </div>

      {vista === "resumen" ? (
        <>
          <section className="space-y-1 rounded-lg bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-tinta/70">Ganancia real</p>
            <p className={`text-3xl font-semibold ${r.ganancia < 0 ? "text-red-700" : "text-primario"}`}>
              {formatoCOP(r.ganancia)}
            </p>
            <p className="text-xs text-tinta/70">Cuenta los viajes desde que se hacen, estén cobrados o no.</p>
          </section>
          <section className="space-y-1 rounded-lg bg-white p-4 shadow-sm">
            <Fila texto={`Viajes (${r.viajes})`} valor={formatoCOP(r.ingresos)} />
            <Fila texto="Comisión de conductores" valor={formatoCOP(r.comisiones)} />
            <Fila texto="Gastos" valor={formatoCOP(r.gastos)} />
            {TIPOS_GASTO.map((t) => (
              <p key={t.valor} className="flex justify-between pl-4 text-sm text-tinta/70">
                <span>{t.texto}</span>
                <span>{formatoCOP(r.porTipo[t.valor as keyof typeof r.porTipo])}</span>
              </p>
            ))}
          </section>
        </>
      ) : (
        <>
          {gastos.data!.length === 0 && <p className="text-center text-tinta/70">No hay gastos este mes.</p>}
          <ul className="space-y-2">
            {gastos.data!.map((g) => (
              <li key={g.id} className="rounded-lg bg-white p-3 shadow-sm">
                <p className="flex justify-between">
                  <span className="font-semibold">{texto(g.tipo)}</span>
                  <span className="font-semibold">{formatoCOP(g.monto)}</span>
                </p>
                <p className="text-sm text-tinta/70">
                  {g.fecha}
                  {g.km !== null && ` · ${g.km.toLocaleString("es-CO")} km`}
                  {g.nota && ` · ${g.nota}`}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link
        href={`/gastos/nuevo?camion=${id}`}
        className="block rounded-lg border border-primario px-3 py-3 text-center font-semibold text-primario"
      >
        Agregar gasto
      </Link>
    </main>
  );
}
