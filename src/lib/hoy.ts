// "Hoy" en Colombia como fecha ISO (YYYY-MM-DD). Una sola regla de zona horaria para toda la app.
export const hoyBogota = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
