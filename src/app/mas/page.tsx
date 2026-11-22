import Link from "next/link";

// Más: acceso a lo que no cabe en la barra. Irán entrando conductores, respaldo y avisos.
const ENTRADAS = [{ href: "/clientes", texto: "Clientes", detalle: "Plazo de pago y retenciones" }];

export default function Mas() {
  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-semibold">Más</h1>
      <ul className="space-y-3">
        {ENTRADAS.map((e) => (
          <li key={e.href}>
            <Link href={e.href} className="block rounded-lg bg-white p-4 shadow-sm">
              <p className="font-semibold">{e.texto}</p>
              <p className="text-sm text-tinta/70">{e.detalle}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
