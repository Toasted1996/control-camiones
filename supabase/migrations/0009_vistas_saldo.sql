-- =============================================================================
-- 0009_vistas_saldo.sql — Saldo calculado en la base y lista de viajes filtrable
-- =============================================================================
-- Antes las pantallas traían todas las cuentas con todos sus pagos y calculaban el saldo en la
-- app. Con estas vistas la base lo calcula y las pantallas piden solo lo que necesitan
-- (cuentas con saldo > 0, un trozo de la lista de viajes).
--
-- Las reglas son las mismas de src/dominio/cobros.ts; si cambian allá, cambian aquí:
--   saldoCuenta = total - sum(monto + retefuente + ica)   (el anticipo es un pago más)
--   estadoViaje = pagado >= total -> pagado; pagado > 0 -> abonado; emitida -> cobrado; sin_cobrar
--
-- security_invoker: la vista corre con los permisos de quien consulta, así RLS sigue mandando.
-- =============================================================================

create view public.cuentas_saldo with (security_invoker = true) as
select
  c.id,
  c.tramo_id,
  c.emitida,
  c.fecha_emision,
  c.vence,
  c.total,
  count(p.id)::int                                                   as n_pagos,
  coalesce(sum(p.monto + p.retefuente + p.ica), 0)::bigint           as pagado,
  (c.total - coalesce(sum(p.monto + p.retefuente + p.ica), 0))::bigint as saldo
from public.cuentas_cobro c
left join public.pagos p on p.cuenta_id = c.id
group by c.id;

-- Un renglón por viaje, para buscar (cliente o manifiesto), filtrar por estado y paginar en la base.
-- La cuenta se emite junto para los dos tramos: "emitida" se lee del tramo de ida.
create view public.viajes_lista with (security_invoker = true) as
select
  x.*,
  case
    when x.pagado >= x.total then 'pagado'
    when x.pagado > 0        then 'abonado'
    when x.emitida           then 'cobrado'
    else 'sin_cobrar'
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

revoke all on public.cuentas_saldo, public.viajes_lista from anon;
grant select on public.cuentas_saldo, public.viajes_lista to authenticated;
