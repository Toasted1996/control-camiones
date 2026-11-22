"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { actualizarCliente } from "./acciones";

const campo = "mt-1 w-full rounded-lg border border-black/20 bg-white px-3 py-3";

export default function FormularioCliente(inicial: {
  id: string;
  contacto: string;
  plazo: string;
  retefuente: string;
  ica: string;
}) {
  const router = useRouter();
  const [contacto, setContacto] = useState(inicial.contacto);
  const [plazo, setPlazo] = useState(inicial.plazo);
  const [retefuente, setRetefuente] = useState(inicial.retefuente);
  const [ica, setIca] = useState(inicial.ica);
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    empezar(async () => {
      const r = await actualizarCliente(inicial.id, { contacto, plazo, retefuente, ica });
      if (r.ok) router.push("/clientes");
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <label className="block">
        <span className="text-sm">Plazo de pago (días)</span>
        <input inputMode="numeric" value={plazo} onChange={(e) => setPlazo(e.target.value)} placeholder="Ej. 30" className={campo} />
        <span className="mt-1 block text-sm text-tinta/70">
          Las cuentas que emitas vencen ese número de días después. Vacío: vencen el mismo día.
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm">Retefuente (%)</span>
          <input inputMode="decimal" value={retefuente} onChange={(e) => setRetefuente(e.target.value)} required className={campo} />
        </label>
        <label className="block">
          <span className="text-sm">ICA (por mil)</span>
          <input inputMode="decimal" value={ica} onChange={(e) => setIca(e.target.value)} required className={campo} />
        </label>
      </div>
      <p className="text-sm text-tinta/70">
        Son las retenciones que se sugieren al registrar un pago; ahí también se pueden editar.
      </p>

      <label className="block">
        <span className="text-sm">Contacto (opcional)</span>
        <input value={contacto} onChange={(e) => setContacto(e.target.value)} maxLength={200} className={campo} />
      </label>

      {error && <p role="alert" className="text-center text-sm text-red-700">{error}</p>}
      <button
        disabled={pendiente}
        className="w-full rounded-lg bg-primario px-3 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pendiente ? "Guardando..." : "Guardar cliente"}
      </button>
    </form>
  );
}
