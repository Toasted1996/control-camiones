// La sesión dura como máximo 10 días desde que se inicia: pasado ese plazo hay que volver a
// ingresar, aunque se use la app a diario (hay datos de personas y cuentas bancarias).
export const COOKIE_INICIO = "inicio_sesion";
export const DURACION_SESION_MS = 10 * 24 * 60 * 60 * 1000;

// `valor` es la marca de tiempo (ms) guardada al iniciar. Sin marca válida se considera vencida.
export function sesionVencida(valor: string | undefined, ahora: number): boolean {
  const inicio = Number(valor);
  return !Number.isFinite(inicio) || ahora - inicio > DURACION_SESION_MS;
}
