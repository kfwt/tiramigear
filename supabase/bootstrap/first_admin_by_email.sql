-- tiramigear first admin bootstrap by email
-- Run this once after the first user has signed up in Supabase Auth.
--
-- Replace REPLACE_WITH_ADMIN_EMAIL with the exact email address used during signup.

do $$
declare
  admin_email text := 'REPLACE_WITH_ADMIN_EMAIL';
  admin_user_id uuid;
  org_id uuid;
begin
  select id
  into admin_user_id
  from auth.users
  where email = admin_email
  order by created_at desc
  limit 1;

  if admin_user_id is null then
    raise exception 'No auth user found for email %', admin_email;
  end if;

  insert into public.organizations (name, slug, plan)
  values ('Tirami GmbH', 'tirami', 'mvp')
  on conflict (slug)
  do update set name = excluded.name
  returning id into org_id;

  insert into public.profiles (id, org_id, email, name, role, is_active)
  values (admin_user_id, org_id, admin_email, 'Admin', 'admin', true)
  on conflict (id)
  do update set
    org_id = excluded.org_id,
    email = excluded.email,
    name = excluded.name,
    role = 'admin',
    is_active = true,
    updated_at = now();
end;
$$;
