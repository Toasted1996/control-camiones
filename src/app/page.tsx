import Link from "next/link";
import FondoCarretera from "@/components/FondoCarretera";
import Placa from "@/components/Placa";
import { formatoCOP } from "@/dominio/dinero";
import { limitesMes, nombreMes } from "@/dominio/fechas";
import { SELECT_SALDOS, totalesCobro, VISTA_COBROS } from "@/lib/consultas-cobros";
import { resumirMes, SELECT_GASTOS_MES, SELECT_VIAJES_MES } from "@/lib/consultas-camiones";
import { hoyBogota } from "@/lib/hoy";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Inicio: resumen del mes (ganancia, por cobrar y vencido) y los camiones, cada uno con su ganancia
// del mes; tocar una placa abre el detalle del camión.
export default async function Inicio() {
  const hoy = hoyBogota();
  const mes = hoy.slice(0, 7);
  const { desde, hasta } = limitesMes(mes);
  const supabase = await crearClienteServidor();
  const [camiones, viajes, gastos, cuentas] = await Promise.all([
    supabase.from("camiones").select("id, placa, nombre").eq("activo", true).order("placa"),
    supabase.from("viajes").select(SELECT_VIAJES_MES).gte("fecha", desde).lt("fecha", hasta),
    supabase.from("gastos").select(SELECT_GASTOS_MES).gte("fecha", desde).lt("fecha", hasta),
    // Solo lo que falta por cobrar y su vencimiento: sin tramos ni pagos.
    supabase.from(VISTA_COBROS).select(SELECT_SALDOS).eq("emitida", true).gt("saldo", 0),
  ]);
  for (const r of [camiones, viajes, gastos, cuentas]) if (r.error) throw new Error(r.error.message);

  const porCamion = camiones.data!.map((c) => ({ ...c, ...resumirMes(viajes.data, gastos.data, c.id) }));
  const ganancia = porCamion.reduce((s, c) => s + c.ganancia, 0);
  const { porCobrar, vencido } = totalesCobro(cuentas.data, hoy);

  return (
    // -mb-16 + pb-16: la carretera llega hasta el borde inferior, bajo el relleno que deja el layout
    // para el distintivo de Netlify.
    <div className="relative -mb-16 flex flex-1 flex-col overflow-hidden pb-16">
      <FondoCarretera />
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Inicio</h1>
          <p className="text-sm text-tinta/70 first-letter:uppercase">{nombreMes(mes)}</p>
        </div>

        <section className="space-y-2">
          <Dato texto="Ganancia" valor={formatoCOP(ganancia)} rojo={ganancia < 0} grande />
          <div className="grid grid-cols-2 gap-2">
            <Dato texto="Por cobrar" valor={formatoCOP(porCobrar)} />
            <Dato texto="Vencido" valor={formatoCOP(vencido)} rojo={vencido > 0} />
          </div>
        </section>

        {/* my-auto centra las placas en el espacio que queda bajo el resumen, en cualquier alto de pantalla. */}
        <ul className="my-auto space-y-6">
          {porCamion.map((c, i) => (
            <li key={c.id}>
              <Link href={`/camiones/${c.id}`} className="flex flex-col items-center gap-1">
                <Placa placa={c.placa} indice={i} grande />
                {c.nombre && <span className="text-sm text-tinta/70">{c.nombre}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

function Dato({
  texto,
  valor,
  rojo = false,
  grande = false,
}: {
  texto: string;
  valor: string;
  rojo?: boolean;
  grande?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-sm text-tinta/70">{texto}</p>
      <p className={`font-bold ${grande ? "text-3xl" : "text-xl"} ${rojo ? "text-red-700" : ""}`}>{valor}</p>
    </div>
  );
}
