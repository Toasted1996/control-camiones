import Link from "next/link";
import { verNumero } from "@/lib/clientes";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Lista de clientes (empresas) con su plazo de pago y sus retenciones. Se editan al tocarlos.
export default async function Clientes() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, plazo_dias, retefuente_pct, ica_por_mil")
    .order("nombre");
  if (error) throw new Error(error.message);

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4 pb-24">
      <Link href="/mas" className="text-sm text-primario">← Más</Link>
      <h1 className="text-2xl font-semibold">Clientes</h1>
      {data.length === 0 && (
        <p className="text-center text-tinta/70">Aún no hay clientes. Se crean al escribir la empresa en un viaje.</p>
      )}
      <ul className="space-y-3">
        {data.map((c) => (
          <li key={c.id}>
            <Link href={`/clientes/${c.id}`} className="block space-y-1 rounded-lg bg-white p-4 shadow-sm">
              <p className="flex items-center justify-between gap-2">
                <span className="font-semibold">{c.nombre}</span>
                {c.plazo_dias === null && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Falta plazo</span>
                )}
              </p>
              <p className="text-sm text-tinta/70">
                {c.plazo_dias === null ? "Sin plazo" : `Plazo ${c.plazo_dias} días`} · Retefuente {verNumero(c.retefuente_pct)} % ·
                ICA {verNumero(c.ica_por_mil)} por mil
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
