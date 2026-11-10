-- =============================================================================
-- 0002_rls.sql — Seguridad por filas (RLS)
-- =============================================================================
-- Modelo: un solo usuario (el dueño). Solo un usuario autenticado puede leer y
-- escribir; el rol anónimo no ve nada.
--
-- IMPORTANTE (se hace en el panel de Supabase, no en SQL):
--   Authentication > Sign In / Providers > desactivar "Allow new users to sign up".
--   Así nadie más puede registrarse y "autenticado" equivale a "el dueño".
--   El usuario del dueño se crea a mano en Authentication > Users.
--
-- La función programada de avisos usa SUPABASE_SERVICE_ROLE_KEY, que se salta
-- RLS por diseño. Esa clave nunca debe llegar al navegador ni al repositorio.
-- =============================================================================

-- Defensa en profundidad: el rol anónimo no tiene permisos sobre las tablas,
-- ni las actuales ni las que se creen después.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- El usuario autenticado puede leer y escribir (RLS decide además qué filas).
-- Se otorga de forma explícita para no depender de los permisos por defecto.
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'camiones', 'conductores', 'clientes', 'viajes', 'tramos',
    'cuentas_cobro', 'pagos', 'gastos', 'mantenimientos',
    'mantenimientos_programados', 'documentos', 'push_suscripciones', 'config'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy solo_autenticado on public.%I
         for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
