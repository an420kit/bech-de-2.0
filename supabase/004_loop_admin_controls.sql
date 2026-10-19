-- LOOP owner controls: email allow-list plus listing moderation/removal.
-- Run this SQL in Supabase SQL Editor after schema.sql and 002_marketplace.sql.
-- Owner identity is checked from the signed Supabase JWT; never put an admin secret in browser code.

create or replace function public.is_bechde_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'ankitmishra489@gmail.com';
$$;

revoke all on function public.is_bechde_admin() from public;
grant execute on function public.is_bechde_admin() to authenticated;

create or replace function public.admin_list_listings()
returns table (
  id uuid,
  seller_id uuid,
  title text,
  category text,
  price_paise bigint,
  city text,
  status text,
  created_at timestamptz,
  photo_urls text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_bechde_admin() then
    raise exception 'Admin access required';
  end if;
  return query
  select l.id,l.seller_id,l.title,l.category,l.price_paise,l.city,l.status::text,l.created_at,l.photo_urls
  from public.listings l
  order by l.created_at desc
  limit 250;
end;
$$;

create or replace function public.admin_remove_listing(p_listing_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  if not public.is_bechde_admin() then
    raise exception 'Admin access required';
  end if;
  update public.listings
  set status = 'removed', updated_at = now()
  where id = p_listing_id and status <> 'removed';
  get diagnostics changed = row_count;
  return changed > 0;
end;
$$;

create or replace function public.admin_set_listing_status(p_listing_id uuid,p_status text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  if not public.is_bechde_admin() then
    raise exception 'Admin access required';
  end if;
  if p_status not in ('active','paused','sold','removed') then
    raise exception 'Unsupported listing status';
  end if;
  update public.listings
  set status = p_status::public.listing_status, updated_at = now()
  where id = p_listing_id;
  get diagnostics changed = row_count;
  return changed > 0;
end;
$$;

revoke all on function public.admin_list_listings() from public;
revoke all on function public.admin_remove_listing(uuid) from public;
revoke all on function public.admin_set_listing_status(uuid,text) from public;
grant execute on function public.admin_list_listings() to authenticated;
grant execute on function public.admin_remove_listing(uuid) to authenticated;
grant execute on function public.admin_set_listing_status(uuid,text) to authenticated;
