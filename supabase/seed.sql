-- =============================================================================
-- seed.sql — DATOS DE ARRANQUE DE EJEMPLO
-- =============================================================================
-- ATENCIÓN: todo lo de aquí es de ejemplo (placas, nombres y teléfonos falsos).
-- Reemplazar por los datos reales antes de usar el sistema, desde la app o
-- editando este archivo antes de ejecutarlo. Ejecutar DESPUÉS de las migraciones.
-- Los vencimientos de documentos y el kilometraje actual se cargan con los datos reales.
-- =============================================================================

insert into public.camiones (nombre, placa) values
  ('Camión 1 (EJEMPLO)', 'AAA111'),
  ('Camión 2 (EJEMPLO)', 'BBB222'),
  ('Camión 3 (EJEMPLO)', 'CCC333');

insert into public.conductores (nombre, telefono, camion_id)
select v.nombre, v.telefono, c.id
from (values
  ('Conductor 1 (EJEMPLO)', '3000000001', 'AAA111'),
  ('Conductor 2 (EJEMPLO)', '3000000002', 'BBB222'),
  ('Conductor 3 (EJEMPLO)', '3000000003', 'CCC333')
) as v (nombre, telefono, placa)
join public.camiones c on c.placa = v.placa;

insert into public.clientes (nombre, contacto, plazo_dias) values
  ('Cliente 1 (EJEMPLO)', '3100000001', 0),
  ('Cliente 2 (EJEMPLO)', '3100000002', 30),
  ('Cliente 3 (EJEMPLO)', '3100000003', 45);
