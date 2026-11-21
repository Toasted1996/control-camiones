-- Guarda en la cuenta de cobro los datos de quien cobra (nombre, NIT, dirección, teléfono, banco,
-- tipo y número de cuenta) tal como se escribieron al emitirla, para poder verla o imprimirla
-- después sin volver a llenarlos. Va en las cuentas de todos los tramos del viaje.
-- emitir_cuenta pasa a recibir esos datos; se reemplaza la versión de un solo parámetro (0004).
alter table public.cuentas_cobro add column datos_pago jsonb;

drop function if exists public.emitir_cuenta(uuid);

create or replace function public.emitir_cuenta(p_viaje uuid, p_datos jsonb)
returns void
language plpgsql
security invoker
as $$
declare
  v_hoy   date := (now() at time zone 'America/Bogota')::date;
  v_plazo integer;
begin
  perform 1
    from public.cuentas_cobro c
    join public.tramos t on t.id = c.tramo_id
   where t.viaje_id = p_viaje and c.emitida;
  if found then
    return;
  end if;

  select coalesce(cl.plazo_dias, 0) into v_plazo
    from public.viajes v
    join public.clientes cl on cl.id = v.cliente_id
   where v.id = p_viaje;
  if not found then
    raise exception 'El viaje no existe';
  end if;

  update public.cuentas_cobro c
     set emitida = true,
         fecha_emision = v_hoy,
         vence = v_hoy + v_plazo,
         datos_pago = p_datos
    from public.tramos t
   where t.id = c.tramo_id and t.viaje_id = p_viaje;
end;
$$;
