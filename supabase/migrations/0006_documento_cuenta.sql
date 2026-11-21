-- La cuenta de cobro emitida se guarda completa, como histórico: encabezado, cliente, fecha del
-- servicio, tramos con sus montos, anticipo, valor a cobrar y los datos de quien cobra, tal como
-- se entregó. Se muestra siempre desde esa copia, aunque después cambie algo del viaje o del cliente.
-- El documento es uno por viaje y vive en la cuenta del tramo de ida.
--
-- Reemplaza a datos_pago (0005): ahora esos datos van dentro de `documento`. Las cuentas emitidas
-- antes de esta migración eran de prueba y quedan sin documento.
--
-- emitir_cuenta recibe el documento armado por la app y le agrega la fecha de emisión y el
-- vencimiento, que se calculan aquí (hoy en Colombia + plazo del cliente). Devuelve true si emitió
-- ahora y false si ya estaba emitida (no cambia nada). Garantías:
--   * El documento debe ser un objeto JSON: nunca queda una cuenta emitida sin copia.
--   * El cambio es un solo update con "not emitida": dos emisiones a la vez no se pisan; gana la primera.
--   * Un viaje sin cuentas es un error, no una emisión silenciosa.
-- security invoker: corre con los permisos de quien llama, así que RLS aplica.
alter table public.cuentas_cobro add column documento jsonb;
alter table public.cuentas_cobro drop column datos_pago;

drop function if exists public.emitir_cuenta(uuid, jsonb);

create or replace function public.emitir_cuenta(p_viaje uuid, p_documento jsonb)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_hoy   date := (now() at time zone 'America/Bogota')::date;
  v_plazo integer;
  v_filas integer;
begin
  if jsonb_typeof(p_documento) is distinct from 'object' then
    raise exception 'Documento de cuenta no válido';
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
         documento = case t.sentido
           when 'ida' then p_documento || jsonb_build_object('emision', v_hoy, 'vence', v_hoy + v_plazo)
         end
    from public.tramos t
   where t.id = c.tramo_id and t.viaje_id = p_viaje and not c.emitida;
  get diagnostics v_filas = row_count;

  if v_filas = 0 and not exists (
    select 1 from public.cuentas_cobro c join public.tramos t on t.id = c.tramo_id where t.viaje_id = p_viaje
  ) then
    raise exception 'El viaje no tiene cuentas de cobro';
  end if;

  return v_filas > 0;
end;
$$;

-- Solo usuarios con sesión pueden emitir (anon no).
revoke execute on function public.emitir_cuenta(uuid, jsonb) from public, anon;
