-- LOOP Banner Studio + owner allow-list.
-- Run this once in Supabase SQL Editor after the existing LOOP schema migrations.
-- Owner access is keyed to the exact Supabase-authenticated email below.

create or replace function public.is_bechde_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'ankitmisra489@gmail.com';
$$;
revoke all on function public.is_bechde_admin() from public;
grant execute on function public.is_bechde_admin() to anon, authenticated;

create table if not exists public.ad_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  placement text not null check (placement in ('home_top','home_middle','category_banner')),
  category text check (category in ('phones','home','laptops','electronics','fashion','toys','other')),
  media_type text not null check (media_type in ('image','video')),
  media_url text not null,
  media_alt text not null default '' check (char_length(media_alt) <= 250),
  button_text text not null default 'Explore' check (char_length(button_text) <= 30),
  target_url text not null default '' check (char_length(target_url) <= 1000),
  active boolean not null default false,
  display_order integer not null default 0 check (display_order between 0 and 999),
  duration_seconds integer check (duration_seconds between 1 and 5),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (placement <> 'category_banner' or category is not null),
  check (media_type <> 'video' or duration_seconds between 1 and 5),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);
create index if not exists ad_banners_active_slot on public.ad_banners(active, placement, category, display_order);
alter table public.ad_banners enable row level security;

drop policy if exists "Public can view live LOOP banners" on public.ad_banners;
drop policy if exists "LOOP admins can view all banners" on public.ad_banners;
drop policy if exists "LOOP admins can create banners" on public.ad_banners;
drop policy if exists "LOOP admins can update banners" on public.ad_banners;
drop policy if exists "LOOP admins can delete banners" on public.ad_banners;

create policy "Public can view live LOOP banners" on public.ad_banners
 for select to anon, authenticated using (
   active = true
   and (starts_at is null or starts_at <= now())
   and (ends_at is null or ends_at > now())
 );
create policy "LOOP admins can view all banners" on public.ad_banners
 for select to authenticated using (public.is_bechde_admin());
create policy "LOOP admins can create banners" on public.ad_banners
 for insert to authenticated with check (public.is_bechde_admin());
create policy "LOOP admins can update banners" on public.ad_banners
 for update to authenticated using (public.is_bechde_admin()) with check (public.is_bechde_admin());
create policy "LOOP admins can delete banners" on public.ad_banners
 for delete to authenticated using (public.is_bechde_admin());
grant select on public.ad_banners to anon, authenticated;
grant insert, update, delete on public.ad_banners to authenticated;

-- Dedicated public-read bucket: only the owner may upload, replace or remove assets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'loop-banners', 'loop-banners', true, 26214400,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "LOOP banner assets are public" on storage.objects;
drop policy if exists "LOOP owner uploads banner assets" on storage.objects;
drop policy if exists "LOOP owner updates banner assets" on storage.objects;
drop policy if exists "LOOP owner deletes banner assets" on storage.objects;

create policy "LOOP banner assets are public" on storage.objects
 for select to anon, authenticated using (bucket_id = 'loop-banners');
create policy "LOOP owner uploads banner assets" on storage.objects
 for insert to authenticated with check (bucket_id = 'loop-banners' and public.is_bechde_admin());
create policy "LOOP owner updates banner assets" on storage.objects
 for update to authenticated using (bucket_id = 'loop-banners' and public.is_bechde_admin())
 with check (bucket_id = 'loop-banners' and public.is_bechde_admin());
create policy "LOOP owner deletes banner assets" on storage.objects
 for delete to authenticated using (bucket_id = 'loop-banners' and public.is_bechde_admin());

comment on table public.ad_banners is 'Owner-managed promotional banners. Images or videos no longer than five seconds.';
