-- Bech De: seller-initiated contact with buyers who expressed interest.
-- Run this migration in Supabase SQL Editor after schema.sql and 002_marketplace.sql.

create or replace function public.seller_contact_interested_buyer(
  p_listing_id uuid,
  p_buyer_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller uuid := auth.uid();
  v_conversation uuid;
  v_listing public.listings%rowtype;
  v_interested boolean := false;
begin
  if v_seller is null then raise exception 'Sign in as the seller first'; end if;
  select * into v_listing from public.listings where id=p_listing_id and seller_id=v_seller and status='active';
  if not found then raise exception 'This active listing does not belong to your account'; end if;
  if p_buyer_id is null or p_buyer_id=v_seller then raise exception 'Invalid buyer'; end if;

  select exists(
    select 1 from public.price_offers o
    where o.listing_id=p_listing_id and o.buyer_id=p_buyer_id
      and o.status in ('pending','accepted')
    union all
    select 1 from public.bids b
    where b.listing_id=p_listing_id and b.bidder_id=p_buyer_id
  ) into v_interested;
  if not v_interested then raise exception 'This buyer has not made an offer or bid on your listing'; end if;

  if exists(select 1 from public.user_blocks b where
    (b.blocker_id=v_seller and b.blocked_id=p_buyer_id) or
    (b.blocker_id=p_buyer_id and b.blocked_id=v_seller)) then
    raise exception 'Messaging is unavailable for this user';
  end if;

  insert into public.conversations(listing_id,buyer_id,seller_id)
  values(p_listing_id,p_buyer_id,v_seller)
  on conflict(listing_id,buyer_id) do update set last_message_at=public.conversations.last_message_at
  returning id into v_conversation;
  return v_conversation;
end;
$$;
revoke all on function public.seller_contact_interested_buyer(uuid,uuid) from public;
grant execute on function public.seller_contact_interested_buyer(uuid,uuid) to authenticated;

-- Enforce seller-first contact at the database level too.
-- Buyers can no longer create conversations directly; the seller-only
-- SECURITY DEFINER function above creates a conversation after verified interest.
drop policy if exists "Buyer starts conversation with active listing" on public.conversations;
revoke all on function public.start_conversation(uuid) from public, authenticated;
