"use client";

import { useState, useTransition } from "react";
import { formatoCOP } from "@/dominio/dinero";
import { documentoDe, type DatosPago, type DocumentoCuenta, type ViajeResumen } from "@/lib/consultas-viajes";
import { emitirCuenta } from "./acciones";

const campo = "mt-1 w-full rounded-lg border border-black/20 bg-white px-3 py-3";
const sinDatos: DatosPago = { quien: "", nit: "", direccion: "", telefono: "", banco: "", tipoCuenta: "", numero: "" };

// Formulario (solo en pantalla) + documento imprimible en hoja carta (ver @page en globals.css).
// Antes de emitir es una vista previa que sigue al formulario; al emitir se guarda completo y de ahí
// se muestra siempre (histórico). Solo la firma queda en blanco.
export default function CuentaDocumento({ v }: { v: ViajeResumen }) {
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();
  const [form, setForm] = useState<DatosPago>({ ...sinDatos, tipoCuenta: "Ahorros" });
  const poner = (k: keyof DatosPago) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  // Emitida: la copia guardada. Emitida antes de existir la copia (datos de prueba): sin datos de cobro.
  const doc: DocumentoCuenta = v.emitida ? (v.documento ?? documentoDe(v, sinDatos)) : documentoDe(v, form);

  function emitir() {
    setError("");
    empezar(async () => {
      const r = await emitirCuenta(v.id, form);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <>
      {!v.emitida && (
        <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm print:hidden">
          <h2 className="font-semibold">Datos para el pago</h2>
          <label className="block">
            <span className="text-sm">Quien cobra (nombre)</span>
            <input value={form.quien} onChange={poner("quien")} className={campo} />
          </label>
          <label className="block">
            <span className="text-sm">Cédula / NIT</span>
            <input value={form.nit} onChange={poner("nit")} className={campo} />
          </label>
          <label className="block">
            <span className="text-sm">Dirección</span>
            <input value={form.direccion} onChange={poner("direccion")} className={campo} />
          </label>
          <label className="block">
            <span className="text-sm">Teléfono</span>
            <input inputMode="tel" value={form.telefono} onChange={poner("telefono")} className={campo} />
          </label>
          <label className="block">
            <span className="text-sm">Banco</span>
            <input value={form.banco} onChange={poner("banco")} className={campo} />
          </label>
          <label className="block">
            <span className="text-sm">Tipo de cuenta</span>
            <select value={form.tipoCuenta} onChange={poner("tipoCuenta")} className={campo}>
              <option>Ahorros</option>
              <option>Corriente</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm">Número de cuenta</span>
            <input inputMode="numeric" value={form.numero} onChange={poner("numero")} className={campo} />
          </label>
        </section>
      )}

      {/* En pantalla se ve como tarjeta; al imprimir ocupa toda la hoja carta, en tamaño de documento. */}
      <article className="space-y-6 rounded-lg bg-white p-5 text-sm shadow-sm print:space-y-8 print:rounded-none print:p-0 print:text-[12pt] print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
          <h1 className="text-xl font-bold uppercase tracking-wide print:text-[22pt]">Cuenta de cobro</h1>
          <div className="text-right">
            {v.emitida ? (
              <>
                <p>Fecha de emisión: {doc.emision}</p>
                <p>Vence: {doc.vence}</p>
              </>
            ) : (
              <p className="text-tinta/70 print:hidden">Sin emitir (vista previa)</p>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 print:grid-cols-2">
          <section>
            <h2 className="mb-1 font-bold uppercase">Cliente</h2>
            <p>{doc.cliente.nombre}</p>
            {doc.cliente.contacto && <p className="text-tinta/70">{doc.cliente.contacto}</p>}
          </section>
          <section>
            <h2 className="mb-1 font-bold uppercase">Servicio de transporte</h2>
            <p>Fecha del servicio: {doc.fechaServicio}</p>
            <p>Vehículo: {doc.placa}</p>
          </section>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-black text-left">
              <th className="py-2 pr-2">Tramo</th>
              <th className="py-2 pr-2">Ruta</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {doc.tramos.map((t) => (
              <tr key={t.sentido} className="border-b border-black/20 align-top">
                <td className="py-2 pr-2">
                  {t.sentido === "ida" ? "Ida" : "Regreso"}
                  {t.anticipo > 0 && (
                    <span className="block text-tinta/70">Anticipo recibido: {formatoCOP(t.anticipo)}</span>
                  )}                </td>
                <td className="py-2 pr-2">{t.origen || t.destino ? `${t.origen ?? "—"} → ${t.destino ?? "—"}` : "—"}</td>
                <td className="py-2 text-right">{formatoCOP(t.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="ml-auto w-full space-y-1 sm:w-2/3 print:w-2/3">
          <p className="flex justify-between">
            <span>Valor total del servicio</span>
            <span>{formatoCOP(doc.total)}</span>
          </p>
          <p className="flex justify-between">
            <span>(−) Anticipo</span>
            <span>{formatoCOP(doc.anticipo)}</span>
          </p>
          <p className="flex justify-between border-t-2 border-black pt-1 text-base font-bold print:text-[14pt]">
            <span>Valor a cobrar</span>
            <span>{formatoCOP(doc.aCobrar)}</span>
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="mb-1 font-bold uppercase">Datos para el pago</h2>
          <p>Quien cobra: {doc.datos.quien || "—"}</p>
          <p>Cédula / NIT: {doc.datos.nit || "—"}</p>
          <p>Dirección: {doc.datos.direccion || "—"}</p>
          <p>Teléfono: {doc.datos.telefono || "—"}</p>
          <p>Banco: {doc.datos.banco || "—"}</p>
          <p>Tipo de cuenta: {doc.datos.tipoCuenta || "—"}</p>
          <p>Número de cuenta: {doc.datos.numero || "—"}</p>
        </section>

        <section className="pt-16 print:pt-24">
          <div className="w-2/3 border-t border-black pt-1">
            <p className="font-semibold">Firma de quien solicita el cobro</p>
            <p className="text-tinta/70">Nombre y cédula / NIT</p>
          </div>
        </section>
      </article>

      {error && <p role="alert" className="text-center text-sm text-red-700 print:hidden">{error}</p>}
      {v.emitida ? (
        <button
          onClick={() => window.print()}
          className="w-full rounded-lg bg-primario px-3 py-3 font-semibold text-white print:hidden"
        >
          Imprimir / Guardar como PDF
        </button>
      ) : (
        <>
          {doc.aCobrar <= 0 && (
            <p role="note" className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900 print:hidden">
              Este viaje ya está pagado: no hay nada por cobrar.
            </p>
          )}
          <button
            onClick={emitir}
            disabled={pendiente || doc.aCobrar <= 0}
            className="w-full rounded-lg bg-primario px-3 py-3 font-semibold text-white disabled:opacity-60 print:hidden"
          >
            {pendiente ? "Emitiendo..." : "Emitir cuenta de cobro"}
          </button>
        </>
      )}
    </>
  );
}
