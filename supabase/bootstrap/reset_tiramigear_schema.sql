-- tiramigear schema reset for early setup only.
-- Use this only before real production data exists.

drop table if exists public.audit_logs cascade;
drop table if exists public.exports cascade;
drop table if exists public.condition_events cascade;
drop table if exists public.item_photos cascade;
drop table if exists public.damage_reports cascade;
drop table if exists public.logistics_load_items cascade;
drop table if exists public.project_vehicle_assignments cascade;
drop table if exists public.vehicles cascade;
drop table if exists public.external_rental_items cascade;
drop table if exists public.external_catalog_items cascade;
drop table if exists public.project_bulk_assignments cascade;
drop table if exists public.project_item_assignments cascade;
drop table if exists public.project_positions cascade;
drop table if exists public.projects cascade;
drop table if exists public.package_external_items cascade;
drop table if exists public.package_bulk_items cascade;
drop table if exists public.package_cases cascade;
drop table if exists public.package_items cascade;
drop table if exists public.packages cascade;
drop table if exists public.case_bulk_items cascade;
drop table if exists public.case_items cascade;
drop table if exists public.bulk_items cascade;
drop table if exists public.items cascade;
drop table if exists public.cases cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;

drop function if exists public.current_profile_is_admin() cascade;
drop function if exists public.current_profile_role() cascade;
drop function if exists public.current_profile_org_id() cascade;
drop function if exists public.set_updated_at() cascade;

drop type if exists public.export_type cascade;
drop type if exists public.damage_status cascade;
drop type if exists public.load_status cascade;
drop type if exists public.load_source_type cascade;
drop type if exists public.position_source_type cascade;
drop type if exists public.external_rental_status cascade;
drop type if exists public.project_status cascade;
drop type if exists public.item_condition cascade;
drop type if exists public.equipment_category cascade;
drop type if exists public.app_role cascade;
