-- Ejecutar en Supabase → SQL Editor
-- Sincroniza datos de JALIA entre celular y computador

create table if not exists public.jalia_datos (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ingredientes jsonb not null default '[]'::jsonb,
  recetas jsonb not null default '[]'::jsonb,
  cotizaciones jsonb not null default '[]'::jsonb,
  ventas jsonb not null default '[]'::jsonb,
  lista_compras jsonb not null default '[]'::jsonb,
  consignaciones jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.jalia_datos enable row level security;

create policy "jalia_select_own"
  on public.jalia_datos for select
  using (auth.uid() = user_id);

create policy "jalia_insert_own"
  on public.jalia_datos for insert
  with check (auth.uid() = user_id);

create policy "jalia_update_own"
  on public.jalia_datos for update
  using (auth.uid() = user_id);

create policy "jalia_delete_own"
  on public.jalia_datos for delete
  using (auth.uid() = user_id);

-- Realtime (para sync entre dispositivos)
alter publication supabase_realtime add table public.jalia_datos;
