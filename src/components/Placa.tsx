// Placa amarilla colombiana: fondo amarillo, borde negro, "COLOMBIA" arriba.
// `indice` escalona la animación de entrada entre varias placas.
export default function Placa({
  placa,
  indice = 0,
  grande = false,
}: {
  placa: string;
  indice?: number;
  grande?: boolean;
}) {
  return (
    <div
      className={grande ? "placa placa-grande" : "placa"}
      style={{ animationDelay: `${indice * 120}ms` }}
      aria-label={`Placa ${placa}`}
    >
      <span className="placa-pais">COLOMBIA</span>
      <span className="placa-texto">{placa}</span>
    </div>
  );
}
