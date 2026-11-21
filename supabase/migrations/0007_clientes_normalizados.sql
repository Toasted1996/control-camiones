-- Nombres de cliente (empresa) normalizados: sin espacios de más y en MAYÚSCULAS, y sin duplicados.
-- "transportes  andina" y "Transportes Andina" son la misma empresa.
--
--  * normalizar_nombre: recorta, junta espacios repetidos y pasa a mayúsculas.
--  * Un disparador lo aplica a clientes.nombre en cada alta o cambio (así lo guardado ya viene normal).
--  * nombre_clave: el nombre sin tildes (Á→A, É→E, ...), usado solo para comparar; la Ñ se conserva.
--    Es única: la base impide dos empresas que solo se distingan por mayúsculas, espacios o tildes.
-- Si ya hay clientes que, normalizados, quedan iguales, el índice único falla y avisa cuál: se
-- unen o se renombran a mano antes de volver a correr.

create or replace function public.normalizar_nombre(p_nombre text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(regexp_replace(btrim(p_nombre), '\s+', ' ', 'g'));
$$;

create or replace function public.clientes_normalizar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.nombre := public.normalizar_nombre(new.nombre);
  return new;
end;
$$;

create trigger clientes_normalizar
  before insert or update of nombre on public.clientes
  for each row execute function public.clientes_normalizar();

-- Normaliza los clientes que ya existen (el disparador hace el trabajo).
update public.clientes set nombre = nombre;

alter table public.clientes
  add constraint clientes_nombre_no_vacio check (btrim(nombre) <> '');

alter table public.clientes
  add column nombre_clave text generated always as (
    translate(public.normalizar_nombre(nombre), 'ÁÉÍÓÚÜ', 'AEIOUU')
  ) stored;

create unique index clientes_nombre_clave_key on public.clientes (nombre_clave);

-- Busca la empresa por su nombre normalizado y, si no existe, la crea. Así el formulario del viaje
-- escribe el nombre y el sistema reutiliza la empresa existente (avisando) o crea una nueva.
-- Devuelve su id y `creado` (true = se creó ahora; false = ya existía). El nombre guardado queda
-- normalizado por el disparador. Una empresa nueva queda sin plazo de pago (se completa después).
-- Si dos llamadas la crean a la vez, gana la primera y la otra devuelve la existente.
-- security invoker: corre con los permisos de quien llama, así que RLS aplica.
create or replace function public.buscar_o_crear_cliente(p_nombre text)
returns table (cliente_id uuid, creado boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_nombre text := public.normalizar_nombre(p_nombre);
  v_clave  text;
  v_id     uuid;
begin
  if v_nombre is null or v_nombre = '' then
    raise exception 'El nombre de la empresa es obligatorio';
  end if;
  v_clave := translate(v_nombre, 'ÁÉÍÓÚÜ', 'AEIOUU');

  select c.id into v_id from public.clientes c where c.nombre_clave = v_clave;
  if found then
    return query select v_id, false;
    return;
  end if;

  insert into public.clientes (nombre) values (v_nombre)
  on conflict (nombre_clave) do nothing
  returning id into v_id;

  if v_id is null then
    -- Otra llamada la creó justo antes: se devuelve esa.
    select c.id into v_id from public.clientes c where c.nombre_clave = v_clave;
    return query select v_id, false;
  else
    return query select v_id, true;
  end if;
end;
$$;

revoke execute on function public.buscar_o_crear_cliente(text) from public, anon;
