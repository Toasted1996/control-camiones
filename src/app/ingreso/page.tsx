"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

// Pantalla de ingreso: correo y clave. No hay registro público; el usuario
// del dueño se crea a mano en el panel de Supabase.
export default function Ingreso() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const datos = new FormData(e.currentTarget);
    const { error } = await crearClienteNavegador().auth.signInWithPassword({
      email: String(datos.get("correo")),
      password: String(datos.get("clave")),
    });
    if (error) {
      setError("Correo o clave incorrectos");
      setCargando(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Control de camiones</h1>
        <label className="block">
          <span className="text-sm">Correo</span>
          <input
            name="correo"
            type="email"
            autoComplete="username"
            required
            className="mt-1 w-full rounded-lg border border-black/20 bg-white px-3 py-3"
          />
        </label>
        <label className="block">
          <span className="text-sm">Clave</span>
          <input
            name="clave"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-lg border border-black/20 bg-white px-3 py-3"
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button
          disabled={cargando}
          className="w-full rounded-lg bg-[#14524A] px-3 py-3 font-semibold text-white disabled:opacity-60"
        >
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
