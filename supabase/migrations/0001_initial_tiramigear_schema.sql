-- tiramigear initial Supabase schema
-- Draft migration generated from docs/tiramigear-datenmodell.md

create extension if not exists pgcrypto;

create type public.app_role as enum (
  'admin',
  'user',
  'logistics',
  'technician'
);

create type public.equipment_category as enum (
  'audio',
  'lighting',
  'video',
  'truss_rigging',
  'cables_accessories',
  'other'
);

create type public.item_condition as enum (
  'good',
  'minor_issues',
  'defective',
  'in_repair',
  'missing'
);

create type public.project_status as enum (
  'inquiry_calculation',
  'planned',
  'confirmed',
  'packing',
  'loaded',
  'in_use',
  'returned',
  'in_check',
  'completed',
  'cancelled'
);

create type public.external_rental_status as enum (
  'need_open',
  'requested',
  'confirmed',
  'pickup_planned',
  'picked_up_or_delivered',
  'in_use',
  'return_due',
  'returned',
  'settled'
);

create type public.position_source_type as enum (
  'item',
  'bulk_item',
  'case',
  'external',
  'manual'
);

create type public.load_source_type as enum (
  'case',
  'item',
  'bulk_item',
  'external'
);

create type public.load_status as enum (
  'open',
  'loaded',
  'returned',
  'problem'
);

create type public.damage_status as enum (
  'open',
  'in_progress',
  'resolved'
);

create type public.export_type as enum (
  'excel_calculation',
  'pdf_internal_calculation',
  'pdf_packlist',
  'pdf_vehicle_packlist'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  name text not null,
  role public.app_role not null default 'user',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  empty_weight numeric(10, 3) not null default 0 check (empty_weight >= 0),
  max_weight numeric(10, 3) check (max_weight is null or max_weight >= 0),
  length_cm numeric(10, 2) check (length_cm is null or length_cm >= 0),
  width_cm numeric(10, 2) check (width_cm is null or width_cm >= 0),
  height_cm numeric(10, 2) check (height_cm is null or height_cm >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger cases_set_updated_at
before update on public.cases
for each row execute function public.set_updated_at();

create table public.items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category public.equipment_category not null,
  serial_number text,
  barcode text,
  weight numeric(10, 3) not null check (weight >= 0),
  condition public.item_condition not null default 'good',
  current_case_id uuid references public.cases(id) on delete set null,
  purchase_date date,
  purchase_price numeric(12, 2) check (purchase_price is null or purchase_price >= 0),
  supplier text,
  supplier_contact text,
  daily_rate numeric(12, 2) not null default 0 check (daily_rate >= 0),
  half_day_rate numeric(12, 2) check (half_day_rate is null or half_day_rate >= 0),
  hourly_rate numeric(12, 2) check (hourly_rate is null or hourly_rate >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index items_org_barcode_unique
on public.items(org_id, barcode)
where barcode is not null;

create trigger items_set_updated_at
before update on public.items
for each row execute function public.set_updated_at();

create table public.bulk_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category public.equipment_category not null default 'cables_accessories',
  barcode text,
  total_quantity integer not null default 0 check (total_quantity >= 0),
  available_quantity_override integer check (
    available_quantity_override is null or available_quantity_override >= 0
  ),
  unit_weight numeric(10, 3) check (unit_weight is null or unit_weight >= 0),
  daily_rate numeric(12, 2) check (daily_rate is null or daily_rate >= 0),
  purchase_price_total numeric(12, 2) check (
    purchase_price_total is null or purchase_price_total >= 0
  ),
  supplier text,
  supplier_contact text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index bulk_items_org_barcode_unique
on public.bulk_items(org_id, barcode)
where barcode is not null;

create trigger bulk_items_set_updated_at
before update on public.bulk_items
for each row execute function public.set_updated_at();

create table public.case_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (case_id, item_id)
);

create table public.case_bulk_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  bulk_item_id uuid not null references public.bulk_items(id) on delete cascade,
  default_quantity integer not null check (default_quantity >= 0),
  created_at timestamptz not null default now(),
  unique (case_id, bulk_item_id)
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger packages_set_updated_at
before update on public.packages
for each row execute function public.set_updated_at();

create table public.package_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  unique (package_id, item_id)
);

create table public.package_cases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  unique (package_id, case_id)
);

create table public.package_bulk_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  bulk_item_id uuid not null references public.bulk_items(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unique (package_id, bulk_item_id)
);

create table public.package_external_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  description text not null,
  category public.equipment_category,
  quantity integer not null check (quantity > 0),
  expected_sell_price numeric(12, 2) check (
    expected_sell_price is null or expected_sell_price >= 0
  ),
  notes text
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  client text,
  location text,
  status public.project_status not null default 'inquiry_calculation',
  event_start_at timestamptz,
  event_end_at timestamptz,
  pack_at timestamptz,
  load_at timestamptz not null,
  return_at timestamptz not null,
  check_due_at timestamptz,
  discount_percent numeric(6, 3) not null default 0 check (
    discount_percent >= 0 and discount_percent <= 100
  ),
  vat_rate numeric(6, 3) not null default 8.1 check (vat_rate >= 0),
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (return_at >= load_at),
  check (event_end_at is null or event_start_at is null or event_end_at >= event_start_at)
);

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create table public.project_positions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_type public.position_source_type not null,
  source_id uuid,
  description text not null,
  category public.equipment_category,
  quantity numeric(12, 3) not null check (quantity >= 0),
  days numeric(12, 3) not null default 1 check (days >= 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  total_price numeric(12, 2) not null default 0 check (total_price >= 0),
  counts_for_amortization boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.project_item_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  position_id uuid references public.project_positions(id) on delete set null,
  return_status public.item_condition,
  returned_at timestamptz,
  unique (project_id, item_id)
);

create table public.project_bulk_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  bulk_item_id uuid not null references public.bulk_items(id) on delete restrict,
  position_id uuid references public.project_positions(id) on delete set null,
  planned_quantity integer not null check (planned_quantity >= 0),
  returned_quantity integer check (returned_quantity is null or returned_quantity >= 0),
  defective_quantity integer check (defective_quantity is null or defective_quantity >= 0),
  missing_quantity integer check (missing_quantity is null or missing_quantity >= 0),
  notes text,
  unique (project_id, bulk_item_id)
);

create table public.external_rental_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  position_id uuid references public.project_positions(id) on delete set null,
  description text not null,
  category public.equipment_category,
  quantity integer not null check (quantity > 0),
  supplier text,
  supplier_contact text,
  purchase_price numeric(12, 2) check (purchase_price is null or purchase_price >= 0),
  sell_price numeric(12, 2) check (sell_price is null or sell_price >= 0),
  rental_start_at timestamptz,
  rental_end_at timestamptz,
  status public.external_rental_status not null default 'need_open',
  pickup_notes text,
  return_notes text,
  problem_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (rental_end_at is null or rental_start_at is null or rental_end_at >= rental_start_at)
);

create trigger external_rental_items_set_updated_at
before update on public.external_rental_items
for each row execute function public.set_updated_at();

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  vehicle_type text not null,
  payload_kg numeric(10, 3) check (payload_kg is null or payload_kg >= 0),
  volume_m3 numeric(10, 3) check (volume_m3 is null or volume_m3 >= 0),
  license_plate text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger vehicles_set_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

create table public.project_vehicle_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_name_snapshot text not null,
  payload_kg_snapshot numeric(10, 3) check (
    payload_kg_snapshot is null or payload_kg_snapshot >= 0
  ),
  notes text
);

create table public.logistics_load_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_vehicle_assignment_id uuid not null references public.project_vehicle_assignments(id) on delete cascade,
  source_type public.load_source_type not null,
  source_id uuid,
  description text not null,
  quantity numeric(12, 3) not null default 1 check (quantity >= 0),
  weight_kg_snapshot numeric(10, 3) check (
    weight_kg_snapshot is null or weight_kg_snapshot >= 0
  ),
  loaded_status public.load_status not null default 'open'
);

create table public.damage_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  item_id uuid references public.items(id) on delete set null,
  bulk_item_id uuid references public.bulk_items(id) on delete set null,
  external_rental_item_id uuid references public.external_rental_items(id) on delete set null,
  reported_by uuid not null references public.profiles(id),
  condition public.item_condition,
  quantity integer check (quantity is null or quantity >= 0),
  title text not null,
  description text,
  status public.damage_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.item_photos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  item_id uuid references public.items(id) on delete cascade,
  damage_report_id uuid references public.damage_reports(id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  check (item_id is not null or damage_report_id is not null)
);

create table public.condition_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  from_condition public.item_condition,
  to_condition public.item_condition not null,
  note text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  export_type public.export_type not null,
  file_path text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index profiles_org_id_idx on public.profiles(org_id);
create index items_org_id_idx on public.items(org_id);
create index items_case_id_idx on public.items(current_case_id);
create index bulk_items_org_id_idx on public.bulk_items(org_id);
create index cases_org_id_idx on public.cases(org_id);
create index projects_org_status_idx on public.projects(org_id, status);
create index projects_availability_window_idx on public.projects(org_id, load_at, return_at);
create index project_positions_project_id_idx on public.project_positions(project_id);
create index project_item_assignments_item_id_idx on public.project_item_assignments(item_id);
create index project_bulk_assignments_bulk_item_id_idx on public.project_bulk_assignments(bulk_item_id);
create index external_rental_items_project_id_idx on public.external_rental_items(project_id);
create index damage_reports_project_id_idx on public.damage_reports(project_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

create or replace function public.current_profile_org_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.org_id
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active = true
$$;

create or replace function public.current_profile_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active = true
$$;

create or replace function public.current_profile_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_profile_role() = 'admin', false)
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;

create policy organizations_select_own
on public.organizations
for select
using (id = public.current_profile_org_id());

create policy profiles_select_own_org
on public.profiles
for select
using (org_id = public.current_profile_org_id());

create policy profiles_update_admin
on public.profiles
for update
using (org_id = public.current_profile_org_id() and public.current_profile_is_admin())
with check (org_id = public.current_profile_org_id() and public.current_profile_is_admin());

create policy profiles_insert_admin
on public.profiles
for insert
with check (org_id = public.current_profile_org_id() and public.current_profile_is_admin());

do $$
declare
  table_name text;
  org_tables text[] := array[
    'items',
    'bulk_items',
    'item_photos',
    'cases',
    'case_items',
    'case_bulk_items',
    'packages',
    'package_items',
    'package_cases',
    'package_bulk_items',
    'package_external_items',
    'projects',
    'project_positions',
    'project_item_assignments',
    'project_bulk_assignments',
    'external_rental_items',
    'vehicles',
    'project_vehicle_assignments',
    'logistics_load_items',
    'damage_reports',
    'condition_events',
    'exports',
    'audit_logs'
  ];
begin
  foreach table_name in array org_tables loop
    execute format('alter table public.%I enable row level security', table_name);

    execute format(
      'create policy %I on public.%I for select using (org_id = public.current_profile_org_id())',
      table_name || '_select_own_org',
      table_name
    );

    execute format(
      'create policy %I on public.%I for insert with check (org_id = public.current_profile_org_id())',
      table_name || '_insert_own_org',
      table_name
    );

    execute format(
      'create policy %I on public.%I for update using (org_id = public.current_profile_org_id()) with check (org_id = public.current_profile_org_id())',
      table_name || '_update_own_org',
      table_name
    );

    execute format(
      'create policy %I on public.%I for delete using (org_id = public.current_profile_org_id() and public.current_profile_is_admin())',
      table_name || '_delete_admin',
      table_name
    );
  end loop;
end;
$$;

-- Initial admin bootstrap note:
-- The first organization and first admin profile should be inserted via a trusted service-role script
-- or through the Supabase dashboard before normal authenticated access is used.
