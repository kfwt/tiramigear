-- tiramigear first admin bootstrap
-- Run this once in the Supabase SQL Editor after:
-- 1. The initial schema migration has been applied.
-- 2. The first admin user has been created in Authentication.
--
-- Replace the placeholders below before running.

begin;

with org as (
  insert into public.organizations (name, slug, plan)
  values ('Tirami GmbH', 'tirami', 'mvp')
  on conflict (slug)
  do update set name = excluded.name
  returning id
)
insert into public.profiles (id, org_id, email, name, role, is_active)
select
  'REPLACE_WITH_AUTH_USER_ID'::uuid,
  org.id,
  'REPLACE_WITH_ADMIN_EMAIL',
  'Admin',
  'admin',
  true
from org
on conflict (id)
do update set
  org_id = excluded.org_id,
  email = excluded.email,
  name = excluded.name,
  role = 'admin',
  is_active = true,
  updated_at = now();

commit;
