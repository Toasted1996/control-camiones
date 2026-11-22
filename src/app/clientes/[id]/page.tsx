import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import FormularioCliente from "./FormularioCliente";

// Edición de un cliente: plazo de pago, retenciones sugeridas y contacto.
export default async function EditarCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, contacto, plazo_dias, retefuente_pct, ica_por_mil")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4 pb-24">
      <Link href="/clientes" className="text-sm text-primario">← Clientes</Link>
      <h1 className="text-2xl font-semibold">{data.nombre}</h1>
      <FormularioCliente
        id={data.id}
        contacto={data.contacto ?? ""}
        plazo={data.plazo_dias === null ? "" : String(data.plazo_dias)}
        retefuente={String(Number(data.retefuente_pct)).replace(".", ",")}
        ica={String(Number(data.ica_por_mil)).replace(".", ",")}
      />
    </main>
  );
}
