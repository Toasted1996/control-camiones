import Link from "next/link";
import { notFound } from "next/navigation";
import { rendicionAnticipo } from "@/dominio/anticipo";
import { formatoCOP } from "@/dominio/dinero";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { resumirViaje, SELECT_VIAJE } from "@/lib/consultas-viajes";

// Detalle de un viaje: cobro por tramo (con barra de pago), comisión y rendición del anticipo.
export default async function DetalleViaje({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const [{ data }, { data: gastos }] = await Promise.all([
    supabase.from("viajes").select(SELECT_VIAJE).eq("id", id).maybeSingle(),
    supabase.from("gastos").select("monto").eq("viaje_id", id),
  ]);
  if (!data) notFound();

  const v = resumirViaje(data);
  const gastado = (gastos ?? []).reduce((s, g) => s + g.monto, 0);

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4 pb-24">
      <Link href="/viajes" className="text-sm text-primario">← Viajes</Link>
      <div>
        <h1 className="text-2xl font-semibold">{v.cliente.nombre}</h1>
        <p className="text-sm text-tinta/70">
          {v.fecha} · {v.placa} · {v.conductor}
        </p>
      </div>

      {v.tramos.map((t) => {
        const pct = t.monto > 0 ? Math.min(100, Math.round((t.pagado / t.monto) * 100)) : 0;
        return (
          <section key={t.manifiesto} className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
            <h2 className="font-semibold">
              {t.sentido === "ida" ? "Ida" : "Regreso"} · Manifiesto {t.manifiesto}
            </h2>
            {(t.origen || t.destino) && (
              <p className="text-sm text-tinta/70">{t.origen ?? "—"} → {t.destino ?? "—"}</p>
            )}
            <div className="h-2 overflow-hidden rounded-full bg-black/10">
              <div className="h-full bg-primario" style={{ width: `${pct}%` }} />
            </div>
            <Fila texto="Monto del servicio" valor={formatoCOP(t.monto)} />
            <Fila texto="Pagado (anticipo y abonos)" valor={formatoCOP(t.pagado)} />
            <Fila texto="Saldo por cobrar" valor={formatoCOP(t.saldo)} />
            <Fila texto="Comisión del conductor" valor={formatoCOP(t.comision)} />
          </section>
        );
      })}

      {v.anticipo > 0 && (
        <section className="space-y-1 rounded-lg bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Anticipo</h2>
          <Fila texto="Anticipo recibido" valor={formatoCOP(v.anticipo)} />
          <Fila texto="Gastos del viaje" valor={formatoCOP(gastado)} />
          <Fila texto="Comisión del conductor" valor={formatoCOP(v.comision)} />
          <Fila texto="Debe devolver el conductor" valor={formatoCOP(rendicionAnticipo(v.anticipo, gastado, v.comision))} />
        </section>
      )}

      <Link
        href={`/viajes/${v.id}/cuenta`}
        className="block rounded-lg bg-primario px-3 py-3 text-center font-semibold text-white"
      >
        Ver cuenta de cobro
      </Link>
    </main>
  );
}

function Fila({ texto, valor }: { texto: string; valor: string }) {
  return (
    <p className="flex justify-between text-sm">
      <span className="text-tinta/70">{texto}</span>
      <span className="font-semibold">{valor}</span>
    </p>
  );
}
