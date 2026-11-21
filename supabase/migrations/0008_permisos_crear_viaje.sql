-- Defensa en profundidad (audit): crear_viaje (0003) quedó ejecutable por el rol anónimo, que es el
-- permiso por defecto de las funciones. Un anónimo igual fallaría (no tiene permisos sobre las tablas
-- y RLS aplica), pero se quita para que solo un usuario con sesión pueda llamarla, como ya pasa con
-- emitir_cuenta (0006) y buscar_o_crear_cliente (0007).
revoke execute on function public.crear_viaje(jsonb) from public, anon;
