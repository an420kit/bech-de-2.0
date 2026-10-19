-- Bech De marketplace completion migration.
-- Run after schema.sql in Supabase SQL Editor. Review before production.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique(listing_id,buyer_id),
  check (buyer_id <> seller_id)
);
create index if not exists conversations_buyer_recent on public.conversations(buyer_id,last_message_at desc);
create index if not exists conversations_seller_recent on public.conversations(seller_id,last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_conversation_recent on public.messages(conversation_id,created_at desc);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,listing_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('message','offer','bid','listing','promotion','safety')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 500),
  target_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_recent on public.notifications(user_id,created_at desc);

create table if not exists public.promotion_orders (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  plan_code text not null check (plan_code in ('boost_3d','boost_7d','boost_30d')),
  amount_paise bigint not null check (amount_paise > 0),
  currency char(3) not null default 'INR' check (currency='INR'),
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled')),
  provider_order_id text unique,
  provider_payment_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists promotion_orders_seller_recent on public.promotion_orders(seller_id,created_at desc);

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id),
  check(blocker_id <> blocked_id)
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.promotion_orders enable row level security;
alter table public.user_blocks enable row level security;

create policy "Conversation participants can view" on public.conversations
 for select to authenticated using (auth.uid()=buyer_id or auth.uid()=seller_id);
create policy "Buyer starts conversation with active listing" on public.conversations
 for insert to authenticated with check (
   auth.uid()=buyer_id and exists (
     select 1 from public.listings l
     where l.id=listing_id and l.seller_id=seller_id and l.seller_id<>auth.uid() and l.status='active'
   )
);
create policy "Participants can update conversation timestamp" on public.conversations
 for update to authenticated using (auth.uid()=buyer_id or auth.uid()=seller_id)
 with check (auth.uid()=buyer_id or auth.uid()=seller_id);

create policy "Participants can read messages" on public.messages
 for select to authenticated using (
   exists(select 1 from public.conversations c where c.id=conversation_id and (c.buyer_id=auth.uid() or c.seller_id=auth.uid()))
);
create policy "Participants can send messages" on public.messages
 for insert to authenticated with check (
   sender_id=auth.uid() and exists(
     select 1 from public.conversations c
     where c.id=conversation_id and (c.buyer_id=auth.uid() or c.seller_id=auth.uid())
   )
);

create policy "Users manage own favorites" on public.favorites
 for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "Users view own notifications" on public.notifications
 for select to authenticated using (user_id=auth.uid());
create policy "Users mark own notifications read" on public.notifications
 for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "Seller views own promotion orders" on public.promotion_orders
 for select to authenticated using (seller_id=auth.uid());
create policy "Seller creates pending promotion order for own listing" on public.promotion_orders
 for insert to authenticated with check (
   seller_id=auth.uid() and status='pending' and exists(
     select 1 from public.listings l where l.id=listing_id and l.seller_id=auth.uid()
   )
);
create policy "Users manage own block list" on public.user_blocks
 for all to authenticated using (blocker_id=auth.uid()) with check (blocker_id=auth.uid());

-- Conversation creation always derives seller_id from the listing; never trust a client-supplied seller.
create or replace function public.start_conversation(p_listing_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid := auth.uid(); v_seller uuid; v_conversation uuid;
begin
 if v_user is null then raise exception 'Sign in to contact a seller'; end if;
 select seller_id into v_seller from public.listings where id=p_listing_id and status='active';
 if v_seller is null then raise exception 'Listing is not available'; end if;
 if v_seller=v_user then raise exception 'You cannot message yourself'; end if;
 if exists(select 1 from public.user_blocks b where (b.blocker_id=v_user and b.blocked_id=v_seller) or (b.blocker_id=v_seller and b.blocked_id=v_user)) then
   raise exception 'Messaging is unavailable for this user';
 end if;
 insert into public.conversations(listing_id,buyer_id,seller_id)
 values(p_listing_id,v_user,v_seller)
 on conflict(listing_id,buyer_id) do update set last_message_at=public.conversations.last_message_at
 returning id into v_conversation;
 return v_conversation;
end;
$$;
revoke all on function public.start_conversation(uuid) from public;
grant execute on function public.start_conversation(uuid) to authenticated;

-- Automatically update conversation timestamp when a message is sent.
create or replace function public.bump_conversation_timestamp()
returns trigger language plpgsql set search_path=''
as $$
begin
 update public.conversations set last_message_at=new.created_at where id=new.conversation_id;
 return new;
end;
$$;
drop trigger if exists messages_bump_conversation on public.messages;
create trigger messages_bump_conversation after insert on public.messages
for each row execute function public.bump_conversation_timestamp();


-- Create a public-read photo bucket; uploads are restricted to each authenticated user's folder.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('listing-photos','listing-photos',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

create policy "Public can view listing photos" on storage.objects
 for select using (bucket_id='listing-photos');
create policy "Users upload photos into own folder" on storage.objects
 for insert to authenticated with check (
   bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text
);
create policy "Users update own listing photos" on storage.objects
 for update to authenticated using (
   bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text
) with check (
   bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text
);
create policy "Users delete own listing photos" on storage.objects
 for delete to authenticated using (
   bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text
);

-- Create a basic profile when an auth user signs up.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path=''
as $
begin
 insert into public.profiles(id,display_name)
 values(new.id,coalesce(nullif(new.raw_user_meta_data->>'display_name',''),split_part(coalesce(new.email,'member'),'@',1)))
 on conflict(id) do nothing;
 return new;
end;
$;
drop trigger if exists on_auth_user_created_bechde on auth.users;
create trigger on_auth_user_created_bechde after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Expose only a seller's public display name, never phone/email.
create or replace view public.public_seller_profiles with (security_invoker=false) as
select id,display_name,city,created_at from public.profiles;
grant select on public.public_seller_profiles to anon, authenticated;


-- IMPORTANT: promotion_orders INSERT creates only a pending order.
-- A trusted server/payment webhook must verify provider signatures and payment status.
-- Never let browser clients mark orders paid or directly set is_promoted.
