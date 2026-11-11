-- Datos de prueba. Se borran al terminar el proyecto:
--   delete from public.clientes where nombre like '[PRUEBA]%';
-- (Los viajes de prueba que cuelguen de ellos se borran antes, desde la app o con SQL.)
insert into public.clientes (nombre, contacto, plazo_dias) values
  ('[PRUEBA] Transportes Andina', 'Cliente de prueba 1', 30),
  ('[PRUEBA] Distribuidora Norte', 'Cliente de prueba 2', 15);
