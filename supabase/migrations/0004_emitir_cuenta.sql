-- Emite la cuenta de cobro de un viaje: marca sus cuentas como emitidas, con la fecha de
-- emisión (hoy en Colombia) y el vencimiento (emisión + plazo del cliente).
-- Cubre las cuentas de todos los tramos del viaje (ida y regreso), porque el documento es uno.
-- Si el viaje ya estaba emitido no hace nada.
-- security invoker: corre con los permisos de quien llama, así que RLS aplica.
create or replace function public.emitir_cuenta(p_viaje uuid)
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
         vence = v_hoy + v_plazo
    from public.tramos t
   where t.id = c.tramo_id and t.viaje_id = p_viaje;
end;
$$;
