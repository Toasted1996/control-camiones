// Camión de lado (cabina a la derecha, puerta trasera a la izquierda).
// "carga": las cajas caen dentro y el camión queda cargado.
// "descarga": las cajas salen por atrás y el camión queda vacío.
// Se anima una vez; para repetirla, monta el componente de nuevo (cambia su key).
export default function CamionAnimado({ modo }: { modo: "carga" | "descarga" }) {
  const cajas = [0, 1, 2];
  return (
    <svg
      viewBox="0 0 120 70"
      className={`camion camion-${modo}`}
      role="img"
      aria-label={modo === "carga" ? "Camión cargando" : "Camión descargando"}
    >
      {/* Carrocería de carga */}
      <rect x="4" y="12" width="74" height="36" rx="3" fill="#fff" stroke="#14524a" strokeWidth="3" />
      {/* Cajas */}
      {cajas.map((i) => (
        <rect
          key={i}
          className="camion-caja"
          style={{ animationDelay: `${i * 350}ms` }}
          x={10 + i * 22}
          y="26"
          width="18"
          height="18"
          rx="2"
          fill="#c98b3b"
          stroke="#8a5a1c"
          strokeWidth="2"
        />
      ))}
      {/* Cabina */}
      <path d="M80 22h20l12 14v12H80z" fill="#fcd116" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
      <path d="M86 27h11l7 9H86z" fill="#bfe6f5" />
      {/* Ruedas */}
      {[24, 50, 98].map((x) => (
        <g key={x}>
          <circle cx={x} cy="52" r="8" fill="#111" />
          <circle cx={x} cy="52" r="3" fill="#ccc" />
        </g>
      ))}
    </svg>
  );
}
