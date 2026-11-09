import { diasEntre } from "./fechas";
import { formatoCOP } from "./dinero";
import { sugerirAceite } from "./kilometraje";

export { diasEntre };

// Un aviso para mostrar al dueño: de qué tipo es, a qué se refiere y el detalle.
export type Alerta = {
  tipo: "deuda" | "papel" | "aceite" | "km";
  titulo: string;
  detalle: string;
};

// Datos que necesita calcularAlertas. `ultimoAviso` es la fecha ISO del último aviso
// enviado de ese elemento (vacío si nunca se avisó).
// - cuentas: cuentas de cobro con su saldo pendiente y vencimiento.
// - papeles: SOAT, técnico-mecánica, seguro, licencia; `completado` = ya renovado.
// - camiones: kilometraje actual, fecha de la última lectura y datos del aceite (opcionales).
export type EntradaAlertas = {
  cuentas: {
    titulo: string;
    saldo: number;
    vence: string;
    ultimoAviso?: string | null;
  }[];
  papeles: {
    titulo: string;
    vence: string;
    completado: boolean;
    ultimoAviso?: string | null;
  }[];
  camiones: {
    nombre: string;
    kmActual: number;
    ultimaLectura: string;
    ultimoAceiteKm?: number | null;
    cadaKm?: number | null;
  }[];
};

// Reglas de frecuencia (días) y ventanas.
const CADA_DEUDA = 3; // deuda vencida: recordar cada 3 días
const CADA_PAPEL = 7; // papeles: recordar cada semana
const DIAS_PAPEL = 30; // papeles: empezar a avisar 30 días antes
const DIAS_KM = 15; // kilometraje: pedir actualizar si pasaron más de 15 días

// ¿Toca avisar? Sí si nunca se avisó o si ya pasaron al menos `cada` días desde el último aviso.
const toca = (ultimoAviso: string | null | undefined, hoy: string, cada: number) =>
  !ultimoAviso || diasEntre(ultimoAviso, hoy) >= cada;

// Calcula los avisos que tocan hoy, por tipo:
// - deuda: saldo > 0, ya vencida, y toca según el último aviso.
// - papel: sin renovar, vence en ≤ 30 días (o ya venció), y toca según el último aviso.
// - km: la última lectura tiene más de 15 días.
// - aceite: se acerca el cambio (ver sugerirAceite); solo si hay datos de aceite.
export function calcularAlertas(e: EntradaAlertas, hoy: string): Alerta[] {
  const out: Alerta[] = [];

  for (const c of e.cuentas) {
    if (c.saldo > 0 && c.vence < hoy && toca(c.ultimoAviso, hoy, CADA_DEUDA)) {
      out.push({
        tipo: "deuda",
        titulo: c.titulo,
        detalle: `Vencida hace ${diasEntre(c.vence, hoy)} días, saldo ${formatoCOP(c.saldo)}`,
      });
    }
  }

  for (const p of e.papeles) {
    const faltan = diasEntre(hoy, p.vence);
    if (!p.completado && faltan <= DIAS_PAPEL && toca(p.ultimoAviso, hoy, CADA_PAPEL)) {
      out.push({
        tipo: "papel",
        titulo: p.titulo,
        detalle: faltan < 0 ? `Venció hace ${-faltan} días` : `Vence en ${faltan} días`,
      });
    }
  }

  for (const k of e.camiones) {
    if (diasEntre(k.ultimaLectura, hoy) > DIAS_KM) {
      out.push({
        tipo: "km",
        titulo: k.nombre,
        detalle: `Kilometraje sin actualizar hace ${diasEntre(k.ultimaLectura, hoy)} días`,
      });
    }
    if (k.ultimoAceiteKm != null && k.cadaKm != null) {
      const a = sugerirAceite({
        kmActual: k.kmActual,
        ultimoAceiteKm: k.ultimoAceiteKm,
        cadaKm: k.cadaKm,
      });
      if (a.sugerir) out.push({ tipo: "aceite", titulo: k.nombre, detalle: a.mensaje });
    }
  }

  return out;
}
