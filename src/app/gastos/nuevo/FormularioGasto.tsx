"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { aPesos } from "@/dominio/dinero";
import { TIPOS_GASTO } from "@/lib/gastos";
import { registrarGasto } from "./acciones";

type Camion = { id: string; placa: string };
type Viaje = { id: string; camionId: string; texto: string };

const campo = "mt-1 w-full rounded-lg border border-black/20 bg-white px-3 py-3";

export default function FormularioGasto({
  camiones,
  viajes,
  viajeInicial,
  hoy,
}: {
  camiones: Camion[];
  viajes: Viaje[];
  viajeInicial: Viaje | null;
  hoy: string;
}) {
  const router = useRouter();
  const [camionId, setCamionId] = useState(viajeInicial?.camionId ?? "");
  const [viajeId, setViajeId] = useState(viajeInicial?.id ?? "");
  const [fecha, setFecha] = useState(hoy);
  const [tipo, setTipo] = useState(TIPOS_GASTO[0].valor);
  const [monto, setMonto] = useState("");
  const [km, setKm] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  // Si el gasto viene de un viaje, el camión ya está definido y no se cambia.
  const fijo = viajeInicial !== null;
  const delCamion = viajes.filter((v) => v.camionId === camionId);

  function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    empezar(async () => {
      const r = await registrarGasto({
        camionId,
        viajeId: viajeId || null,
        fecha,
        tipo,
        monto: aPesos(monto),
        km: km.trim() ? aPesos(km) : null,
        nota,
      });
      if (r.ok) router.push(r.viajeId ? `/viajes/${r.viajeId}` : "/");
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <label className="block">
        <span className="text-sm">Camión</span>
        <select
          value={camionId}
          onChange={(e) => {
            setCamionId(e.target.value);
            setViajeId("");
          }}
          disabled={fijo}
          required
          className={campo}
        >
          <option value="">Elige un camión</option>
          {camiones.map((c) => <option key={c.id} value={c.id}>{c.placa}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-sm">Viaje (opcional)</span>
        <select value={viajeId} onChange={(e) => setViajeId(e.target.value)} disabled={fijo || !camionId} className={campo}>
          <option value="">Gasto suelto del camión</option>
          {delCamion.map((v) => <option key={v.id} value={v.id}>{v.texto}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-sm">Tipo</span>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
          {TIPOS_GASTO.map((t) => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-sm">Monto</span>
        <input inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} required placeholder="0" className={campo} />
      </label>

      <label className="block">
        <span className="text-sm">Fecha</span>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className={campo} />
      </label>

      <label className="block">
        <span className="text-sm">Km del odómetro (opcional)</span>
        <input inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} placeholder="Ej. 120500" className={campo} />
      </label>

      <label className="block">
        <span className="text-sm">Nota (opcional)</span>
        <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} className={campo} />
      </label>

      {error && <p role="alert" className="text-center text-sm text-red-700">{error}</p>}
      <button
        disabled={pendiente}
        className="w-full rounded-lg bg-primario px-3 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pendiente ? "Guardando..." : "Guardar gasto"}
      </button>
    </form>
  );
}
