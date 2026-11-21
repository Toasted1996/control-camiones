"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import Fila from "@/components/Fila";
import { saldoCuenta, type Pago } from "@/dominio/cobros";
import { aPesos, formatoCOP } from "@/dominio/dinero";
import { registrarPago } from "./acciones";

const campo = "mt-1 w-full rounded-lg border border-black/20 bg-white px-3 py-3";

export default function FormularioPago({
  cuentaId,
  cliente,
  titulo,
  total,
  saldo,
  previos,
  sugeridaRetefuente,
  sugeridaIca,
  hoy,
  yaRetuvo,
  idaRegreso,
}: {
  cuentaId: string;
  cliente: string;
  titulo: string;
  total: number;
  saldo: number;
  previos: Pago[];
  sugeridaRetefuente: number;
  sugeridaIca: number;
  hoy: string;
  yaRetuvo: boolean;
  idaRegreso: boolean;
}) {
  const router = useRouter();
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [tipo, setTipo] = useState("abono");
  const [ret, setRet] = useState(String(sugeridaRetefuente));
  const [icaTexto, setIcaTexto] = useState(String(sugeridaIca));
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  const nuevo = { monto: aPesos(monto), retefuente: aPesos(ret), ica: aPesos(icaTexto) };
  // Nuevo saldo con la misma función del dominio que usa el resto de la app.
  const saldoNuevo = saldoCuenta(total, [...previos, nuevo]);

  // "Saldo completo": lo que falta menos las retenciones, para que la cuenta quede en cero.
  function saldoCompleto() {
    setMonto(String(Math.max(0, saldo - nuevo.retefuente - nuevo.ica)));
    setTipo("saldo");
  }

  function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    empezar(async () => {
      const r = await registrarPago({ cuentaId, fecha, tipo, ...nuevo });
      if (r.ok) router.push(`/viajes/${r.viajeId}`);
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <section className="space-y-1 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold">{cliente}</h2>
        <p className="text-sm text-tinta/70">{titulo}</p>
        <Fila texto="Total de la cuenta" valor={formatoCOP(total)} />
        <Fila texto="Saldo actual" valor={formatoCOP(saldo)} />
      </section>

      <label className="block">
        <span className="text-sm">Monto recibido</span>
        <input inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} required placeholder="0" className={campo} />
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={saldoCompleto} className="rounded-full bg-white px-3 py-1 text-sm">
          Saldo completo
        </button>
        <button
          type="button"
          onClick={() => setMonto(String(Math.round(saldo / 2)))}
          className="rounded-full bg-white px-3 py-1 text-sm"
        >
          Mitad
        </button>
      </div>

      <label className="block">
        <span className="text-sm">Fecha</span>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className={campo} />
      </label>

      <label className="block">
        <span className="text-sm">Tipo</span>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
          <option value="abono">Abono</option>
          <option value="saldo">Saldo</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm">Retefuente (editable)</span>
          <input inputMode="numeric" value={ret} onChange={(e) => setRet(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="text-sm">ICA (editable)</span>
          <input inputMode="numeric" value={icaTexto} onChange={(e) => setIcaTexto(e.target.value)} className={campo} />
        </label>
      </div>
      <p role="note" className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
        <strong>{yaRetuvo ? "Retenciones ya cobradas" : "Se cobran retenciones en este pago"}</strong>
        <br />
        {yaRetuvo ? "No se aplican de nuevo al saldo restante." : "No se repiten en los pagos siguientes."}
        {idaRegreso && " Cada tramo tiene las suyas."}
        {" "}Puedes cambiar los valores si el cliente retuvo otra cantidad.
      </p>

      <section className="space-y-1 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Resultado</h2>
        <Fila texto="Nuevo saldo" valor={formatoCOP(saldoNuevo)} />
        <Fila texto="Estado" valor={saldoNuevo <= 0 ? "Pagado" : "Abonado"} />
        {saldoNuevo < 0 && <p className="text-sm text-red-700">El pago supera el saldo de la cuenta.</p>}
      </section>

      {error && <p role="alert" className="text-center text-sm text-red-700">{error}</p>}
      <button
        disabled={pendiente}
        className="w-full rounded-lg bg-primario px-3 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pendiente ? "Guardando..." : "Guardar pago"}
      </button>
    </form>
  );
}
