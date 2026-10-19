-- Bech De production foundation for Supabase/Postgres.
-- Apply only in a new Supabase project after reviewing the launch checklist.
create extension if not exists pgcrypto;

create type public.listing_status as enum ('draft','active','sold','paused','removed');
create type public.listing_condition as enum ('like_new','lightly_used','regularly_used','needs_repair','good');
create type public.report_status as enum ('open','reviewing','resolved','dismissed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  phone text,
  phone_verified boolean not null default false,
  city text,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 90),
  description text not null default '' check (char_length(description) <= 5000),
  category text not null,
  condition public.listing_condition,
  price_paise bigint not null check (price_paise > 0),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  city text not null,
  area text,
  photo_urls text[] not null check (cardinality(photo_urls) between 1 and 8),
  accepts_offers boolean not null default false,
  bidding_enabled boolean not null default false,
  starting_bid_paise bigint,
  reserve_price_paise bigint,
  auction_starts_at timestamptz,
  auction_ends_at timestamptz,
  status public.listing_status not null default 'draft',
  is_promoted boolean not null default false,
  promoted_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not bidding_enabled or (
    starting_bid_paise is not null and starting_bid_paise > 0 and
    auction_starts_at is not null and auction_ends_at is not null and
    auction_ends_at > auction_starts_at and
    (reserve_price_paise is null or reserve_price_paise >= starting_bid_paise)
  ))
);
create index listings_active_city_created on public.listings(city, created_at desc) where status='active';
create index listings_seller_created on public.listings(seller_id, created_at desc);

create table public.price_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id is not null)
);
create index price_offers_listing_created on public.price_offers(listing_id, created_at desc);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  created_at timestamptz not null default now()
);
create index bids_listing_amount on public.bids(listing_id, amount_paise desc, created_at asc);

create table public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null check (char_length(reason) between 3 and 80),
  details text not null default '' check (char_length(details) <= 2000),
  status public.report_status not null default 'open',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.price_offers enable row level security;
alter table public.bids enable row level security;
alter table public.listing_reports enable row level security;

create policy "Public can read active listings" on public.listings for select using (status='active');
create policy "Seller can read own listings" on public.listings for select to authenticated using (seller_id=auth.uid());
create policy "Authenticated users can create own listings" on public.listings for insert to authenticated with check (seller_id=auth.uid());
create policy "Seller can update own listings" on public.listings for update to authenticated using (seller_id=auth.uid()) with check (seller_id=auth.uid());
create policy "Seller can delete own listings" on public.listings for delete to authenticated using (seller_id=auth.uid());

create policy "Users can read own profile" on public.profiles for select to authenticated using (id=auth.uid());
create policy "Users can create own profile" on public.profiles for insert to authenticated with check (id=auth.uid());
create policy "Users can update own profile" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

create policy "Buyer and listing seller can read offers" on public.price_offers for select to authenticated using (
  buyer_id=auth.uid() or exists(select 1 from public.listings l where l.id=listing_id and l.seller_id=auth.uid())
);
create policy "Buyer can submit offers to eligible listings" on public.price_offers for insert to authenticated with check (
  buyer_id=auth.uid() and exists(select 1 from public.listings l where l.id=listing_id and l.status='active' and l.accepts_offers and l.seller_id<>auth.uid())
);
create policy "Buyer can withdraw own pending offer" on public.price_offers for update to authenticated using (buyer_id=auth.uid() and status='pending') with check (buyer_id=auth.uid() and status in ('pending','withdrawn'));

create policy "Signed-in users can read bids on active auctions" on public.bids for select to authenticated using (
  exists(select 1 from public.listings l where l.id=listing_id and l.bidding_enabled and l.status='active')
);

-- All bid writes go through this transaction; no direct INSERT policy is granted.
create or replace function public.place_bid(p_listing_id uuid, p_amount_paise bigint)
returns public.bids
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_listing public.listings%rowtype;
  v_highest bigint;
  v_bid public.bids%rowtype;
begin
  if v_user is null then raise exception 'Sign in to bid'; end if;
  if p_amount_paise is null or p_amount_paise <= 0 then raise exception 'Enter a valid bid'; end if;

  select * into v_listing from public.listings where id=p_listing_id for update;
  if not found or v_listing.status <> 'active' or not v_listing.bidding_enabled then
    raise exception 'This listing is not accepting bids';
  end if;
  if v_listing.seller_id = v_user then raise exception 'You cannot bid on your own listing'; end if;
  if now() < v_listing.auction_starts_at or now() >= v_listing.auction_ends_at then
    raise exception 'The auction is not open';
  end if;

  select max(amount_paise) into v_highest from public.bids where listing_id=p_listing_id;
  v_highest := greatest(coalesce(v_highest, v_listing.starting_bid_paise - 1), v_listing.starting_bid_paise - 1);
  if p_amount_paise <= v_highest then raise exception 'Bid must exceed the current highest bid'; end if;

  insert into public.bids(listing_id,bidder_id,amount_paise)
  values(p_listing_id,v_user,p_amount_paise) returning * into v_bid;
  return v_bid;
end;
$$;
revoke all on function public.place_bid(uuid,bigint) from public;
grant execute on function public.place_bid(uuid,bigint) to authenticated;

create policy "Users can report listings" on public.listing_reports for insert to authenticated with check (reporter_id=auth.uid());
create policy "Reporter can view own reports" on public.listing_reports for select to authenticated using (reporter_id=auth.uid());


-- Seller response is performed server-side so a buyer cannot accept their own offer.
create or replace function public.respond_to_offer(p_offer_id uuid, p_decision text)
returns public.price_offers
language plpgsql
security definer
set search_path = ''
as $
declare
  v_user uuid := auth.uid();
  v_offer public.price_offers%rowtype;
  v_seller uuid;
begin
  if v_user is null then raise exception 'Sign in to respond to offers'; end if;
  if p_decision not in ('accepted','declined') then raise exception 'Decision must be accepted or declined'; end if;
  select o.* into v_offer
  from public.price_offers o
  join public.listings l on l.id=o.listing_id
  where o.id=p_offer_id and l.seller_id=v_user
  for update of o;
  if not found then raise exception 'Offer not found for this seller'; end if;
  if v_offer.status <> 'pending' then raise exception 'This offer is no longer pending'; end if;
  update public.price_offers set status=p_decision, updated_at=now()
  where id=p_offer_id returning * into v_offer;
  return v_offer;
end;
$;
revoke all on function public.respond_to_offer(uuid,text) from public;
grant execute on function public.respond_to_offer(uuid,text) to authenticated;

-- Important: never expose service_role keys in browser code. Configure storage bucket
-- policies for listing-photos, email/SMS verification, rate limiting, admin-only
-- report review, bid notifications, auction close jobs and payment webhooks separately.
