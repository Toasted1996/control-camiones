// Fondo del Inicio: una carretera en perspectiva que se pierde en el horizonte. Es solo decoración
// (aria-hidden, sin interacción) y usa los colores de la app: verde, amarillo de placa y crema.
const ANCHO = 400;
const ALTO = 800;
const HORIZONTE = 70; // y donde la carretera se pierde
const CENTRO = ANCHO / 2;
const MEDIA_CALZADA = { arriba: 10, abajo: 190 }; // mitad del ancho de la calzada en el horizonte y abajo

// Avance 0 (horizonte) a 1 (borde inferior) → y en el dibujo.
const yDe = (t: number) => HORIZONTE + t * (ALTO - HORIZONTE);
const mitad = (t: number) => MEDIA_CALZADA.arriba + t * (MEDIA_CALZADA.abajo - MEDIA_CALZADA.arriba);
const p = (n: number) => n.toFixed(1);

// Trapecio entre dos avances: x = centro + desplazamiento (proporcional a la calzada), con ancho que crece.
function trapecio(t1: number, t2: number, desplazamiento: number, grosor: number) {
  const punto = (t: number) => {
    const x = CENTRO + desplazamiento * mitad(t);
    const g = (grosor * (0.25 + 0.75 * t)) / 2;
    return { y: yDe(t), a: x - g, b: x + g };
  };
  const u = punto(t1);
  const v = punto(t2);
  return `${p(u.a)},${p(u.y)} ${p(u.b)},${p(u.y)} ${p(v.b)},${p(v.y)} ${p(v.a)},${p(v.y)}`;
}

// Rayas centrales: los tramos se alargan al acercarse, como en una carretera de verdad.
const RAYAS = Array.from({ length: 12 }, (_, k) => {
  const a = (k / 12) ** 2;
  const b = ((k + 1) / 12) ** 2;
  return trapecio(a, a + (b - a) * 0.55, 0, 7);
});

export default function FondoCarretera() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        {/* Desvanece el horizonte hacia el crema de la página. */}
        <linearGradient id="carretera-vela" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="carretera-mascara">
          <rect width={ANCHO} height={ALTO} fill="url(#carretera-vela)" />
        </mask>
        <linearGradient id="carretera-asfalto" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14524a" stopOpacity="0.1" />
          <stop offset="1" stopColor="#14524a" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <g mask="url(#carretera-mascara)">
        <polygon
          points={`${p(CENTRO - mitad(0))},${p(yDe(0))} ${p(CENTRO + mitad(0))},${p(yDe(0))} ${p(CENTRO + mitad(1))},${ALTO} ${p(CENTRO - mitad(1))},${ALTO}`}
          fill="url(#carretera-asfalto)"
        />
        <polygon points={trapecio(0, 1, -0.9, 7)} fill="#fff" fillOpacity="0.85" />
        <polygon points={trapecio(0, 1, 0.9, 7)} fill="#fff" fillOpacity="0.85" />
        {RAYAS.map((puntos, i) => (
          <polygon key={i} points={puntos} fill="#fcd116" />
        ))}
      </g>
    </svg>
  );
}
