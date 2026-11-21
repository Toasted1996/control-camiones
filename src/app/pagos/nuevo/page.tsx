import Link from "next/link";
import { notFound } from "next/navigation";
import { ica, retefuente, saldoCuenta } from "@/dominio/cobros";
import { hoyBogota } from "@/lib/hoy";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { uno } from "@/lib/uno";
import FormularioPago from "./FormularioPago";

// Registrar pago de una cuenta de cobro (?cuenta=ID). Carga la cuenta y calcula las retenciones
// sugeridas con las funciones del dominio y los porcentajes del cliente.
export default async function NuevoPago({ searchParams }: { searchParams: Promise<{ cuenta?: string }> }) {
  const { cuenta: cuentaId } = await searchParams;
  if (!cuentaId) notFound();

  const supabase = await crearClienteServidor();
  const { data: cuenta, error } = await supabase
    .from("cuentas_cobro")
    .select(
      "id, total, tramos(manifiesto, sentido, viaje_id, viajes(tipo, clientes(nombre, retefuente_pct, ica_por_mil))), pagos(monto, retefuente, ica)",
    )
    .eq("id", cuentaId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!cuenta) notFound();

  const tramo = uno(cuenta.tramos);
  const viaje = uno(tramo.viajes);
  const cliente = uno(viaje.clientes);

  // Las retenciones se sugieren una sola vez: si ya hubo un pago con retenciones, se sugiere 0.
  const yaRetuvo = cuenta.pagos.some((p: { retefuente: number; ica: number }) => p.retefuente > 0 || p.ica > 0);

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4 pb-24">
      <Link href={`/viajes/${tramo.viaje_id}`} className="text-sm text-primario">← Viaje</Link>
      <h1 className="text-2xl font-semibold">Registrar pago</h1>
      <FormularioPago
        cuentaId={cuenta.id}
        cliente={cliente.nombre}
        titulo={`${tramo.sentido === "ida" ? "Ida" : "Regreso"} · Manifiesto ${tramo.manifiesto}`}
        total={cuenta.total}
        saldo={saldoCuenta(cuenta.total, cuenta.pagos)}
        previos={cuenta.pagos}
        sugeridaRetefuente={yaRetuvo ? 0 : retefuente(cuenta.total, Number(cliente.retefuente_pct))}
        sugeridaIca={yaRetuvo ? 0 : ica(cuenta.total, Number(cliente.ica_por_mil))}
        hoy={hoyBogota()}
        yaRetuvo={yaRetuvo}
        idaRegreso={viaje.tipo === "ida_regreso"}
      />
    </main>
  );
}
