-- =============================================================================
-- 0011_cobros_totales.sql
-- =============================================================================
-- Los totales de Inicio y Cobros se calculan aquí con sum(): antes se sumaban en la app sobre las
-- filas recibidas, y la API corta las respuestas en 1.000 filas sin avisar.
-- "Vencido" usa la fecha de hoy en Colombia, como hoyBogota().
-- =============================================================================

create or replace view public.cobros_totales with (security_invoker = true) as
select
  coalesce(sum(saldo) filter (where saldo > 0), 0)::bigint as por_cobrar,
  coalesce(sum(saldo) filter (where saldo > 0
    and vence < (now() at time zone 'America/Bogota')::date), 0)::bigint as vencido
from public.cuentas_saldo
where emitida;

revoke all on public.cobros_totales from anon;
grant select on public.cobros_totales to authenticated;
