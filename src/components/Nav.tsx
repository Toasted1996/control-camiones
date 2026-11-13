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

// Navegación inferior de 5 entradas. No se muestra en la pantalla de ingreso.
export default function Nav() {
  const ruta = usePathname();
  if (ruta === "/ingreso") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t print:hidden border-black/10 bg-white">
      {ENTRADAS.map(({ href, texto }) => {
        const activa = href === "/" ? ruta === "/" : ruta.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={`flex-1 py-4 text-center text-sm ${
              activa ? "font-bold text-primario" : "text-tinta/70"
            }`}
          >
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
