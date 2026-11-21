// PostgREST devuelve un objeto en las relaciones a uno y una lista en las de muchos: se acepta ambas.
export const uno = <T>(x: T | T[]): T => (Array.isArray(x) ? x[0] : x);
