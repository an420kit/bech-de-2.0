# Bech De — production setup and launch gates

## What is in this repository
- Mobile-first homepage and seller/product pages.
- Optional price-offer and per-listing bidding UI.
- Supabase SQL foundation for listings, profiles, offers, bids, reports, conversations, messages, favorites, notifications, blocks and promotion orders.
- A server-side bid function that serializes bids on the listing row.

## Required external setup (cannot be completed from GitHub alone)
1. Create a Supabase project under the owner's account.
2. Run `supabase/schema.sql`, then `supabase/002_marketplace.sql` in the Supabase SQL editor.
3. Configure Auth providers and redirect URLs for the final production domain.
4. Create a private Storage bucket `listing-photos`. Add upload/read policies that restrict uploads to authenticated owners, enforce image MIME types and size limits, and prevent arbitrary object overwrites.
5. Configure email/phone verification and recovery.
6. Build/deploy trusted server endpoints for payment provider order creation and signed webhook verification; only trusted server code may mark promotions paid or activate a boost.
7. Configure scheduled auction closing, notifications, reports/admin review and retention/deletion jobs.
8. Run security review and integration tests with two buyer accounts, two seller accounts, a seller attempting to bid on own listing, simultaneous bids, expired auctions, blocked users and invalid payment webhooks.
9. Deploy the static frontend over HTTPS and run smoke tests on mobile/desktop.

## Secrets and configuration
Do not commit Supabase service-role keys, payment secrets, SMTP/SMS secrets or admin credentials to GitHub. Public Supabase URL and publishable/anon key may be used in the browser only after RLS policies are reviewed. Store server secrets only in deployment environment variables.

## Launch blocker status
The current HTML pages are not yet wired to a live Supabase project, and there is no deployment configuration or payment provider connection in this repository. Therefore signup, listing persistence, real chat, offers/bids across users, paid promotion and moderation are not yet operational. Do not launch or take payments until those integrations and checks are complete.
