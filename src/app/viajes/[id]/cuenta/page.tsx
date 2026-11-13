import Link from "next/link";
import { notFound } from "next/navigation";
import { sumarDias } from "@/dominio/fechas";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { resumirViaje, SELECT_VIAJE } from "@/lib/consultas-viajes";
import CuentaDocumento from "./CuentaDocumento";

// Cuenta de cobro del viaje: valor del servicio − anticipo = valor a cobrar.
// Sin retenciones: las aplica el cliente al pagar y se registran en el pago.
export default async function CuentaDeCobro({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("viajes").select(SELECT_VIAJE).eq("id", id).maybeSingle();
  if (!data) notFound();

  const v = resumirViaje(data);
  const emision = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  const vence = sumarDias(emision, v.cliente.plazo_dias ?? 0);

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4 pb-24 print:max-w-none print:p-0">
      <Link href={`/viajes/${v.id}`} className="text-sm text-primario print:hidden">← Detalle del viaje</Link>
      <CuentaDocumento v={v} emision={emision} vence={vence} />
    </main>
  );
}
