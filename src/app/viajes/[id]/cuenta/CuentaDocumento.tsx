"use client";

import { useState } from "react";
import { formatoCOP } from "@/dominio/dinero";
import type { ViajeResumen } from "@/lib/consultas-viajes";

const campo = "mt-1 w-full rounded-lg border border-black/20 bg-white px-3 py-3";

// Formulario (solo en pantalla) + documento imprimible en hoja carta (ver @page en globals.css).
// Lo que se escribe arriba sale ya impreso; solo la firma queda en blanco.
export default function CuentaDocumento({
  v,
  emision,
  vence,
}: {
  v: ViajeResumen;
  emision: string;
  vence: string;
}) {
  const [quien, setQuien] = useState("");
  const [nit, setNit] = useState("");
  const [banco, setBanco] = useState("");
  const [tipoCuenta, setTipoCuenta] = useState("Ahorros");
  const [numero, setNumero] = useState("");

  return (
    <>
      <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm print:hidden">
        <h2 className="font-semibold">Datos para el pago</h2>
        <label className="block">
          <span className="text-sm">Quien cobra (nombre)</span>
          <input value={quien} onChange={(e) => setQuien(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="text-sm">Cédula / NIT</span>
          <input value={nit} onChange={(e) => setNit(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="text-sm">Banco</span>
          <input value={banco} onChange={(e) => setBanco(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="text-sm">Tipo de cuenta</span>
          <select value={tipoCuenta} onChange={(e) => setTipoCuenta(e.target.value)} className={campo}>
            <option>Ahorros</option>
            <option>Corriente</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Número de cuenta</span>
          <input inputMode="numeric" value={numero} onChange={(e) => setNumero(e.target.value)} className={campo} />
        </label>
      </section>

      {/* En pantalla se ve como tarjeta; al imprimir ocupa toda la hoja carta, en tamaño de documento. */}
      <article className="space-y-6 rounded-lg bg-white p-5 text-sm shadow-sm print:space-y-8 print:rounded-none print:p-0 print:text-[12pt] print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
          <h1 className="text-xl font-bold uppercase tracking-wide print:text-[22pt]">Cuenta de cobro</h1>
          <div className="text-right">
            <p>Fecha de emisión: {emision}</p>
            <p>Vence: {vence}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 print:grid-cols-2">
          <section>
            <h2 className="mb-1 font-bold uppercase">Cliente</h2>
            <p>{v.cliente.nombre}</p>
            {v.cliente.contacto && <p className="text-tinta/70">{v.cliente.contacto}</p>}
          </section>
          <section>
            <h2 className="mb-1 font-bold uppercase">Servicio de transporte</h2>
            <p>Fecha del servicio: {v.fecha}</p>
            <p>Vehículo: {v.placa}</p>
            <p>Conductor: {v.conductor}</p>
          </section>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-black text-left">
              <th className="py-2 pr-2">Tramo / manifiesto</th>
              <th className="py-2 pr-2">Ruta</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {v.tramos.map((t) => (
              <tr key={t.manifiesto} className="border-b border-black/20 align-top">
                <td className="py-2 pr-2">
                  {t.sentido === "ida" ? "Ida" : "Regreso"} · {t.manifiesto}
                  {t.anticipo > 0 && (
                    <span className="block text-tinta/70">Anticipo recibido: {formatoCOP(t.anticipo)}</span>
                  )}
                </td>
                <td className="py-2 pr-2">{t.origen || t.destino ? `${t.origen ?? "—"} → ${t.destino ?? "—"}` : "—"}</td>
                <td className="py-2 text-right">{formatoCOP(t.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="ml-auto w-full space-y-1 sm:w-2/3 print:w-2/3">
          <p className="flex justify-between">
            <span>Valor total del servicio</span>
            <span>{formatoCOP(v.total)}</span>
          </p>
          <p className="flex justify-between">
            <span>(−) Anticipo</span>
            <span>{formatoCOP(v.anticipo)}</span>
          </p>
          <p className="flex justify-between border-t-2 border-black pt-1 text-base font-bold print:text-[14pt]">
            <span>Valor a cobrar</span>
            <span>{formatoCOP(v.total - v.anticipo)}</span>
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="mb-1 font-bold uppercase">Datos para el pago</h2>
          <p>Quien cobra: {quien || "—"}</p>
          <p>Cédula / NIT: {nit || "—"}</p>
          <p>Banco: {banco || "—"}</p>
          <p>Tipo de cuenta: {tipoCuenta}</p>
          <p>Número de cuenta: {numero || "—"}</p>
        </section>

        <section className="pt-16 print:pt-24">
          <div className="w-2/3 border-t border-black pt-1">
            <p className="font-semibold">Firma de quien solicita el cobro</p>
            <p className="text-tinta/70">Nombre y cédula / NIT</p>
          </div>
        </section>
      </article>

      <button
        onClick={() => window.print()}
        className="w-full rounded-lg bg-primario px-3 py-3 font-semibold text-white print:hidden"
      >
        Imprimir / Guardar como PDF
      </button>
    </>
  );
}
