"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENTRADAS = [
  { href: "/", texto: "Inicio" },
  { href: "/viajes", texto: "Viajes" },
  { href: "/cobros", texto: "Cobros" },
  { href: "/camiones", texto: "Camiones" },
  { href: "/mas", texto: "Más" },
];

// Navegación superior fija de 5 entradas (abajo a la derecha Netlify pone su distintivo, que no se
// puede mover). No se muestra en la pantalla de ingreso.
export default function Nav() {
  const ruta = usePathname();
  if (ruta === "/ingreso") return null;

  return (
    <nav className="sticky top-0 z-10 border-b border-black/10 bg-white print:hidden">
      <div className="mx-auto flex max-w-md">
        {ENTRADAS.map(({ href, texto }) => {
          const activa = href === "/" ? ruta === "/" : ruta.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activa ? "page" : undefined}
              className={`flex-1 border-b-2 py-4 text-center text-sm ${
                activa ? "border-primario font-bold text-primario" : "border-transparent text-tinta/70"
              }`}
            >
              {texto}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
