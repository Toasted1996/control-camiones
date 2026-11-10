-- =============================================================================
-- 0001_esquema.sql — Tablas del sistema "Control de camiones"
-- =============================================================================
-- Convenciones:
--   * Dinero: bigint en pesos enteros (COP). Nunca decimales.
--   * Fechas: tipo date (llega a la app como texto ISO "YYYY-MM-DD").
--   * Porcentajes: numeric. ICA se guarda "por mil" (4.14 = 0,414 %).
--   * Textos con valores fijos: text + CHECK (más fácil de cambiar que un enum).
--   * Llaves: uuid. Cada tabla lleva creado_en.
--   * Borrado: restrict en lo que tiene historia (no se borra un camión con viajes);
--     cascade solo en hijos que no tienen sentido solos (tramos, pagos...).
-- La seguridad (RLS) está en 0002_rls.sql. Ejecutar siempre en orden.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Catálogos: camiones, conductores, clientes
-- ---------------------------------------------------------------------------

create table public.camiones (
  id                 uuid primary key default gen_random_uuid(),
  placa              text not null unique,
  nombre             text,
  km_actual          integer not null default 0 check (km_actual >= 0),
  km_actualizado_en  date,            -- fecha de la última lectura de odómetro
  aceite_cada_km     integer check (aceite_cada_km > 0),
  aceite_ultimo_km   integer check (aceite_ultimo_km >= 0),
  activo             boolean not null default true,
  creado_en          timestamptz not null default now()
);

create table public.conductores (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  telefono      text,
  comision_pct  numeric(5,2) not null default 24 check (comision_pct between 0 and 100),
  camion_id     uuid references public.camiones (id) on delete set null,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

create table public.clientes (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  contacto       text,
  plazo_dias     integer check (plazo_dias >= 0),   -- plazo de pago por defecto
  retefuente_pct numeric(5,2) not null default 1 check (retefuente_pct between 0 and 100),
  ica_por_mil    numeric(6,3) not null default 4.14 check (ica_por_mil between 0 and 1000),
  creado_en      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Viajes y tramos
-- ---------------------------------------------------------------------------

-- Viaje redondo: agrupa 1 o 2 tramos del mismo camión y conductor.
create table public.viajes (
  id               uuid primary key default gen_random_uuid(),
  camion_id        uuid not null references public.camiones (id) on delete restrict,
  conductor_id     uuid not null references public.conductores (id) on delete restrict,
  cliente_id       uuid not null references public.clientes (id) on delete restrict,
  fecha            date not null,
  tipo             text not null check (tipo in ('ida', 'ida_regreso')),
  condicion_pago   text not null check (condicion_pago in (
                     'al_finalizar',
                     'anticipo_saldo_finalizar',
                     'anticipo_saldo_plazo',
                     'a_plazo')),
  -- Anticipo que el cliente pagó y el dueño entregó al conductor. También se
  -- registra como pago tipo 'anticipo' en la cuenta del tramo de ida.
  anticipo_cliente bigint not null default 0 check (anticipo_cliente >= 0),
  km               integer check (km >= 0),         -- odómetro opcional
  nota             text,
  creado_en        timestamptz not null default now()
);

-- Tramo: unidad central, uno por manifiesto.
create table public.tramos (
  id              uuid primary key default gen_random_uuid(),
  viaje_id        uuid not null references public.viajes (id) on delete cascade,
  sentido         text not null check (sentido in ('ida', 'regreso')),
  manifiesto      text not null unique,
  origen          text,
  destino         text,
  monto           bigint not null check (monto >= 0),
  -- La comisión se guarda al registrar, para que cambiar la regla después
  -- no altere los tramos ya registrados (ver baseComision en src/dominio).
  comision_pct    numeric(5,2) not null check (comision_pct between 0 and 100),
  comision_monto  bigint not null check (comision_monto >= 0),
  comision_estado text not null default 'por_pagar' check (comision_estado in ('por_pagar', 'pagada')),
  creado_en       timestamptz not null default now(),
  unique (viaje_id, sentido)                        -- máximo un tramo de ida y uno de regreso
);

-- ---------------------------------------------------------------------------
-- Cobros: una cuenta por tramo, con sus pagos
-- ---------------------------------------------------------------------------

create table public.cuentas_cobro (
  id              uuid primary key default gen_random_uuid(),
  tramo_id        uuid not null unique references public.tramos (id) on delete cascade,  -- 1 a 1
  numero          text unique,                       -- se asigna al emitir
  emitida         boolean not null default false,
  fecha_emision   date,
  vence           date,
  total           bigint not null check (total >= 0),
  ultimo_aviso_en date,                              -- último recordatorio de deuda enviado
  creado_en       timestamptz not null default now(),
  check (not emitida or (fecha_emision is not null and vence is not null))
);

-- El estado de cobro (sin cobrar, cobrado, abonado, pagado) NO se guarda:
-- se calcula desde los pagos (estadoCobro en src/dominio/cobros.ts).
create table public.pagos (
  id          uuid primary key default gen_random_uuid(),
  cuenta_id   uuid not null references public.cuentas_cobro (id) on delete cascade,
  fecha       date not null,
  monto       bigint not null check (monto >= 0),          -- dinero recibido
  tipo        text not null check (tipo in ('anticipo', 'abono', 'saldo')),
  retefuente  bigint not null default 0 check (retefuente >= 0),
  ica         bigint not null default 0 check (ica >= 0),
  nota        text,
  creado_en   timestamptz not null default now(),
  check (monto + retefuente + ica > 0)
);

-- ---------------------------------------------------------------------------
-- Gastos y mantenimientos
-- ---------------------------------------------------------------------------

create table public.gastos (
  id         uuid primary key default gen_random_uuid(),
  camion_id  uuid not null references public.camiones (id) on delete restrict,
  viaje_id   uuid references public.viajes (id) on delete set null,   -- null = gasto suelto del camión
  fecha      date not null,
  tipo       text not null check (tipo in ('combustible', 'peajes', 'otros')),
  monto      bigint not null check (monto >= 0),
  km         integer check (km >= 0),                                  -- odómetro opcional
  nota       text,
  creado_en  timestamptz not null default now()
);

-- Mantenimientos hechos (historial). Su costo cuenta como gasto del camión.
create table public.mantenimientos (
  id           uuid primary key default gen_random_uuid(),
  camion_id    uuid not null references public.camiones (id) on delete restrict,
  descripcion  text not null,
  fecha        date not null,
  km           integer check (km >= 0),
  costo        bigint not null default 0 check (costo >= 0),
  creado_en    timestamptz not null default now()
);

-- Mantenimientos programados: se disparan por kilómetros, por días o por ambos.
create table public.mantenimientos_programados (
  id           uuid primary key default gen_random_uuid(),
  camion_id    uuid not null references public.camiones (id) on delete cascade,
  descripcion  text not null,
  cada_km      integer check (cada_km > 0),
  cada_dias    integer check (cada_dias > 0),
  ultimo_km    integer check (ultimo_km >= 0),
  ultima_fecha date,
  activo       boolean not null default true,
  creado_en    timestamptz not null default now(),
  check (cada_km is not null or cada_dias is not null)
);

-- ---------------------------------------------------------------------------
-- Papeles que vencen
-- ---------------------------------------------------------------------------

-- SOAT, técnico-mecánica y seguro son del camión; la licencia es del conductor.
create table public.documentos (
  id               uuid primary key default gen_random_uuid(),
  camion_id        uuid references public.camiones (id) on delete cascade,
  conductor_id     uuid references public.conductores (id) on delete cascade,
  tipo             text not null check (tipo in ('soat', 'tecnomecanica', 'seguro', 'licencia')),
  vence            date not null,
  completado       boolean not null default false,   -- true = ya renovado; deja de avisar
  ultimo_aviso_en  date,
  creado_en        timestamptz not null default now(),
  check (num_nonnulls(camion_id, conductor_id) = 1),
  check ((tipo = 'licencia') = (conductor_id is not null))
);

-- ---------------------------------------------------------------------------
-- Avisos y configuración
-- ---------------------------------------------------------------------------

create table public.push_suscripciones (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  creado_en  timestamptz not null default now()
);

-- Una sola fila (config del único usuario). La llave booleana fija impide una segunda.
create table public.config (
  id                       boolean primary key default true check (id),
  hora_aviso               time not null default '07:00',
  dias_recordatorio_deuda  integer not null default 3 check (dias_recordatorio_deuda > 0),
  dias_aviso_papeles       integer not null default 30 check (dias_aviso_papeles > 0)
);

insert into public.config default values;

-- ---------------------------------------------------------------------------
-- Índices en llaves foráneas y búsquedas frecuentes
-- ---------------------------------------------------------------------------

create index on public.conductores (camion_id);
create index on public.viajes (camion_id);
create index on public.viajes (conductor_id);
create index on public.viajes (cliente_id);
create index on public.viajes (fecha);
create index on public.tramos (viaje_id);
create index on public.pagos (cuenta_id);
create index on public.gastos (camion_id, fecha);
create index on public.gastos (viaje_id);
create index on public.mantenimientos (camion_id);
create index on public.mantenimientos_programados (camion_id);
create index on public.documentos (camion_id);
create index on public.documentos (conductor_id);
create index on public.documentos (vence) where not completado;
