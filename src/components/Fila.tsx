// Fila de resumen: etiqueta a la izquierda y valor a la derecha.
export default function Fila({ texto, valor }: { texto: string; valor: string }) {
  return (
    <p className="flex justify-between text-sm">
      <span className="text-tinta/70">{texto}</span>
      <span className="font-semibold">{valor}</span>
    </p>
  );
}
