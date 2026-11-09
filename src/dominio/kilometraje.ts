import { diasEntre } from "./fechas";

// Una lectura del odómetro de un camión en una fecha.
export type Lectura = { fecha: string; km: number };

// Kilometraje actual del camión: la lectura más alta registrada.
export function kmActual(lecturas: Lectura[]): number {
  return Math.max(...lecturas.map((l) => l.km));
}

// Promedio de km recorridos por semana entre la lectura más antigua y la más reciente.
// Devuelve null si hay menos de 2 lecturas o si abarcan menos de 7 días (dato poco fiable).
export function kmPorSemana(lecturas: Lectura[]): number | null {
  if (lecturas.length < 2) return null;
  const fechas = lecturas.map((l) => l.fecha).sort();
  const dias = diasEntre(fechas[0], fechas[fechas.length - 1]);
  if (dias < 7) return null;
  const kms = lecturas.map((l) => l.km);
  return (Math.max(...kms) - Math.min(...kms)) / (dias / 7);
}

// Sugiere revisar el aceite cuando faltan `margenKm` o menos para el próximo cambio
// (último cambio + cada cuántos km). Solo sugiere "revisar", nunca ordena cambiar.
// kmRestantes puede ser negativo si ya se pasó; en el mensaje se muestra como 0.
export function sugerirAceite({
  kmActual,
  ultimoAceiteKm,
  cadaKm,
  margenKm = 1000,
}: {
  kmActual: number;
  ultimoAceiteKm: number;
  cadaKm: number;
  margenKm?: number;
}): { sugerir: boolean; kmRestantes: number; mensaje: string } {
  const kmRestantes = ultimoAceiteKm + cadaKm - kmActual;
  if (kmRestantes <= margenKm) {
    const estimados = Math.max(0, kmRestantes);
    return {
      sugerir: true,
      kmRestantes,
      mensaje: `Conviene revisar el aceite pronto (~${estimados} km estimados)`,
    };
  }
  return { sugerir: false, kmRestantes, mensaje: "Aceite al día" };
}
