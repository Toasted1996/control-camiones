"use client";

import { useState } from "react";
import { comisionDe } from "@/dominio/cobros";
import { formatoCOP } from "@/dominio/dinero";

type Camion = { id: string; placa: string };
type Conductor = { id: string; nombre: string; comision_pct: number; camion_id: string | null };
type Cliente = { id: string; nombre: string };

const CONDICIONES = [
  { valor: "al_finalizar", texto: "Al finalizar" },
  { valor: "anticipo_saldo_finalizar", texto: "Anticipo + saldo al finalizar" },
  { valor: "anticipo_saldo_plazo", texto: "Anticipo + saldo a plazo" },
  { valor: "a_plazo", texto: "A plazo" },
];

const campo = "mt-1 w-full rounded-lg border border-black/20 bg-white px-3 py-3";

// Los montos se escriben como texto y se convierten a entero de pesos.
const aPesos = (texto: string) => Number(texto.replace(/\D/g, "")) || 0;

type Tramo = { manifiesto: string; origen: string; destino: string; monto: string; anticipo: string };
const tramoVacio: Tramo = { manifiesto: "", origen: "", destino: "", monto: "", anticipo: "" };

export default function FormularioViaje({
  camiones,
  conductores,
  clientes,
  hoy,
}: {
  camiones: Camion[];
  conductores: Conductor[];
  clientes: Cliente[];
  hoy: string;
}) {
  const [camionId, setCamionId] = useState("");
  const [conductorId, setConductorId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [idaRegreso, setIdaRegreso] = useState(false);
  const [ida, setIda] = useState<Tramo>(tramoVacio);
  const [regreso, setRegreso] = useState<Tramo>(tramoVacio);
  const [condicion, setCondicion] = useState(CONDICIONES[0].valor);

  // Al elegir camión se propone su conductor; se puede cambiar a mano.
  function elegirCamion(id: string) {
    setCamionId(id);
    const asignado = conductores.find((c) => c.camion_id === id);
    if (asignado) setConductorId(asignado.id);
  }

  const conductor = conductores.find((c) => c.id === conductorId);
  const pct = conductor?.comision_pct ?? 24;
  const tramos = idaRegreso ? [ida, regreso] : [ida];
  const total = tramos.reduce((s, t) => s + aPesos(t.monto), 0);
  // La comisión sale de comisionDe (dominio); la pantalla no recalcula la regla.
  const comision = tramos.reduce((s, t) => s + comisionDe({ monto: aPesos(t.monto) }, pct), 0);
  const conAnticipo = condicion.startsWith("anticipo");
  // Cada tramo (ida y regreso) puede traer su propio anticipo del cliente.
  const anticipoTotal = tramos.reduce((s, t) => s + aPesos(t.anticipo), 0);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <label className="block">
        <span className="text-sm">Camión</span>
        <select value={camionId} onChange={(e) => elegirCamion(e.target.value)} required className={campo}>
          <option value="">Elige un camión</option>
          {camiones.map((c) => <option key={c.id} value={c.id}>{c.placa}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-sm">Conductor</span>
        <select value={conductorId} onChange={(e) => setConductorId(e.target.value)} required className={campo}>
          <option value="">Elige un conductor</option>
          {conductores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-sm">Cliente</span>
        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required className={campo}>
          <option value="">Elige un cliente</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-sm">Fecha</span>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className={campo} />
      </label>

      <div className="flex items-center justify-between">
        <span className="font-semibold">Ida y regreso</span>
        <button
          type="button"
          role="switch"
          aria-checked={idaRegreso}
          onClick={() => setIdaRegreso(!idaRegreso)}
          className={`relative h-[31px] w-[51px] rounded-full transition-colors ${idaRegreso ? "bg-primario" : "bg-black/20"}`}
        >
          <span
            className={`absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform ${idaRegreso ? "translate-x-[20px]" : ""}`}
          />
        </button>
      </div>

      <label className="block">
        <span className="text-sm">Condición de pago</span>
        <select value={condicion} onChange={(e) => setCondicion(e.target.value)} className={campo}>
          {CONDICIONES.map((c) => <option key={c.valor} value={c.valor}>{c.texto}</option>)}
        </select>
      </label>

      <BloqueTramo titulo={idaRegreso ? "Tramo de ida" : "Tramo"} valor={ida} cambiar={setIda} conAnticipo={conAnticipo} />
      {idaRegreso && (
        <BloqueTramo titulo="Tramo de regreso" valor={regreso} cambiar={setRegreso} conAnticipo={conAnticipo} />
      )}

      <section className="space-y-1 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Resumen</h2>
        <Fila texto="Total del viaje" valor={formatoCOP(total)} />
        <Fila texto={`Comisión del conductor (${pct}%)`} valor={formatoCOP(comision)} />
        {conAnticipo && <Fila texto="Anticipo del cliente" valor={formatoCOP(anticipoTotal)} />}
      </section>

      <button disabled className="w-full rounded-lg bg-primario px-3 py-3 font-semibold text-white opacity-60">
        Guardar viaje
      </button>
    </form>
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

function BloqueTramo({
  titulo,
  valor,
  cambiar,
  conAnticipo,
}: {
  titulo: string;
  valor: Tramo;
  cambiar: (t: Tramo) => void;
  conAnticipo: boolean;
}) {
  const poner = (k: keyof Tramo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    cambiar({ ...valor, [k]: e.target.value });
  return (
    <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
      <h2 className="font-semibold">{titulo}</h2>
      <label className="block">
        <span className="text-sm">Manifiesto</span>
        <input value={valor.manifiesto} onChange={poner("manifiesto")} required className={campo} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm">Origen</span>
          <input value={valor.origen} onChange={poner("origen")} className={campo} />
        </label>
        <label className="block">
          <span className="text-sm">Destino</span>
          <input value={valor.destino} onChange={poner("destino")} className={campo} />
        </label>
      </div>
      <label className="block">
        <span className="text-sm">Monto</span>
        <input inputMode="numeric" value={valor.monto} onChange={poner("monto")} required placeholder="0" className={campo} />
      </label>
      {conAnticipo && (
        <label className="block">
          <span className="text-sm">Anticipo del cliente</span>
          <input inputMode="numeric" value={valor.anticipo} onChange={poner("anticipo")} placeholder="0" className={campo} />
        </label>
      )}
    </section>
  );
}
