# Base de datos (Supabase)

Orden de ejecución en **SQL Editor** del proyecto de Supabase (o con la CLI de Supabase):

1. `migrations/0001_esquema.sql` — tablas, reglas e índices.
2. `migrations/0002_rls.sql` — seguridad por filas (solo usuario autenticado).
3. `seed.sql` — datos de ejemplo (opcional; reemplazar por los reales).

Antes de usar la app, en el panel de Supabase:

- Authentication → Sign In / Providers → desactivar **Allow new users to sign up**.
- Authentication → Users → crear a mano el usuario del dueño (correo y clave).

Las migraciones nuevas se agregan como `0003_...sql`, `0004_...sql`; no se editan las ya ejecutadas.
