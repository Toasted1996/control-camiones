-- =============================================================================
-- 0010_estado_sin_emitir.sql
-- =============================================================================
-- Un viaje con anticipo pero sin cuenta emitida salía "abonado" y desaparecía de "Sin cobrar".
-- Ahora, sin cuenta emitida, el estado es sin_cobrar (salvo que ya esté pagado por completo).
-- Misma regla que estadoViaje en src/dominio/cobros.ts.
-- =============================================================================

create or replace view public.viajes_lista with (security_invoker = true) as
select
  x.*,
  case
    when x.pagado >= x.total then 'pagado'
    when not x.emitida       then 'sin_cobrar'
    when x.pagado > 0        then 'abonado'
    else 'cobrado'
  end as estado
from (
  select
    v.id,
    v.fecha,
    v.creado_en,
    cl.nombre                                                          as cliente,
    string_agg(t.manifiesto, ' / ')                                    as manifiestos,
    sum(t.monto)::bigint                                               as total,
    coalesce(sum(c.pagado), 0)::bigint                                 as pagado,
    coalesce(bool_or(c.emitida) filter (where t.sentido = 'ida'), false) as emitida
  from public.viajes v
  join public.clientes cl on cl.id = v.cliente_id
  join public.tramos t on t.viaje_id = v.id
  left join public.cuentas_saldo c on c.tramo_id = t.id
  group by v.id, cl.nombre
) x;
