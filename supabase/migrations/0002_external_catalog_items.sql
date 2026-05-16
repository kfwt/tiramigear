-- tiramigear external rental catalog
-- Reusable supplier/rental items that can later be pulled into projects.

create table if not exists public.external_catalog_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category public.equipment_category,
  supplier text,
  supplier_contact text,
  default_quantity integer not null default 1 check (default_quantity > 0),
  unit_weight numeric(10, 3) check (unit_weight is null or unit_weight >= 0),
  purchase_price numeric(12, 2) check (purchase_price is null or purchase_price >= 0),
  sell_price numeric(12, 2) check (sell_price is null or sell_price >= 0),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists external_catalog_items_org_id_idx
on public.external_catalog_items(org_id);

drop trigger if exists external_catalog_items_set_updated_at on public.external_catalog_items;

create trigger external_catalog_items_set_updated_at
before update on public.external_catalog_items
for each row execute function public.set_updated_at();

alter table public.external_catalog_items enable row level security;

drop policy if exists external_catalog_items_select_own_org on public.external_catalog_items;
create policy external_catalog_items_select_own_org
on public.external_catalog_items
for select
using (org_id = public.current_profile_org_id());

drop policy if exists external_catalog_items_insert_own_org on public.external_catalog_items;
create policy external_catalog_items_insert_own_org
on public.external_catalog_items
for insert
with check (org_id = public.current_profile_org_id());

drop policy if exists external_catalog_items_update_own_org on public.external_catalog_items;
create policy external_catalog_items_update_own_org
on public.external_catalog_items
for update
using (org_id = public.current_profile_org_id())
with check (org_id = public.current_profile_org_id());

drop policy if exists external_catalog_items_delete_admin on public.external_catalog_items;
create policy external_catalog_items_delete_admin
on public.external_catalog_items
for delete
using (org_id = public.current_profile_org_id() and public.current_profile_is_admin());
