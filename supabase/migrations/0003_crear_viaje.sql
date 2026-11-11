-- Crea un viaje completo en una sola transacción: viaje, tramos, una cuenta de
-- cobro por tramo y, si un tramo trae anticipo, su pago en la cuenta de ese tramo.
-- Una función de Postgres es atómica: o se guarda todo o no se guarda nada.
-- La comisión llega ya calculada desde la app (comisionDe); aquí no se recalcula.
-- Corre con los permisos de quien llama (security invoker), así que RLS aplica.
create or replace function public.crear_viaje(datos jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_viaje  uuid;
  v_tramo  uuid;
  v_cuenta uuid;
  t        jsonb;
begin
  insert into public.viajes
    (camion_id, conductor_id, cliente_id, fecha, tipo, condicion_pago,
     anticipo_cliente, km, nota)
  values
    ((datos->>'camion_id')::uuid, (datos->>'conductor_id')::uuid,
     (datos->>'cliente_id')::uuid, (datos->>'fecha')::date,
     datos->>'tipo', datos->>'condicion_pago',
     -- Anticipo del viaje = suma de los anticipos de sus tramos (ida y regreso).
     (select coalesce(sum(coalesce((x->>'anticipo')::bigint, 0)), 0)
        from jsonb_array_elements(datos->'tramos') x),
     (datos->>'km')::integer, datos->>'nota')
  returning id into v_viaje;

  for t in select * from jsonb_array_elements(datos->'tramos') loop
    insert into public.tramos
      (viaje_id, sentido, manifiesto, origen, destino, monto,
       comision_pct, comision_monto)
    values
      (v_viaje, t->>'sentido', t->>'manifiesto', t->>'origen', t->>'destino',
       (t->>'monto')::bigint, (t->>'comision_pct')::numeric,
       (t->>'comision_monto')::bigint)
    returning id into v_tramo;

    insert into public.cuentas_cobro (tramo_id, total)
    values (v_tramo, (t->>'monto')::bigint)
    returning id into v_cuenta;

    -- El anticipo de cada tramo se registra como pago en la cuenta de ese tramo.
    if coalesce((t->>'anticipo')::bigint, 0) > 0 then
      insert into public.pagos (cuenta_id, fecha, monto, tipo)
      values (v_cuenta, (datos->>'fecha')::date,
              (t->>'anticipo')::bigint, 'anticipo');
    end if;
  end loop;

  return v_viaje;
end;
$$;
