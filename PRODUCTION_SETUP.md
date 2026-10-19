# LOOP — production setup and launch gates

## What is in this repository
- Mobile-first homepage and seller/product pages.
- Optional price-offer and per-listing bidding UI.
- Supabase SQL foundation for listings, profiles, offers, bids, reports, conversations, messages, favorites, notifications, blocks and promotion orders.
- A server-side bid function that serializes bids on the listing row.
- An owner-only Banner Studio for homepage/category placements, image campaigns and video clips up to five seconds.

## Required external setup (cannot be completed from GitHub alone)
1. Project URL and publishable key have been configured in `assets/config.js` for Supabase project `osalvxajhkgisxisntww`. Only the public `sb_publishable_...` key is included; never commit `sb_secret_...` or `service_role` keys.
2. Run `supabase/schema.sql`, then `supabase/002_marketplace.sql`, `supabase/004_loop_admin_controls.sql`, and `supabase/005_loop_banner_studio.sql` in the Supabase SQL editor. The final two migrations set the exact owner email allow-list to `ankitmisra489@gmail.com` (no `h` in `misra`) and enable owner listing/banner controls.
3. Configure Auth providers and redirect URLs for the final production domain.
4. The migration creates a public-read `listing-photos` bucket (photos are intentionally viewable for active listings) and restricts uploads to each authenticated user's folder. Confirm bucket limits/policies in Supabase after applying the migration.
5. Configure email/phone verification and recovery.
6. Build/deploy trusted server endpoints for payment provider order creation and signed webhook verification; only trusted server code may mark promotions paid or activate a boost.
7. Configure scheduled auction closing, notifications, reports/admin review and retention/deletion jobs.
8. Run security review and integration tests with two buyer accounts, two seller accounts, a seller attempting to bid on own listing, simultaneous bids, expired auctions, blocked users and invalid payment webhooks.
9. In GitHub repository Settings → Pages, select **GitHub Actions** as the source; the workflow in `.github/workflows/pages.yml` will deploy the static frontend on pushes to `main`. Configure the final domain and HTTPS, then run smoke tests on mobile/desktop.

## Secrets and configuration
Do not commit Supabase service-role keys, payment secrets, SMTP/SMS secrets or admin credentials to GitHub. Public Supabase URL and publishable/anon key may be used in the browser only after RLS policies are reviewed. Store server secrets only in deployment environment variables.

## Launch blocker status
The public Supabase URL and publishable key are configured in `assets/config.js`. The frontend includes account, listing, chat, owner moderation and Banner Studio flows. This does **not** prove the database migrations have been applied or that Auth, RLS, Storage, listing publication, chat and offers work. Apply and review `schema.sql`, `002_marketplace.sql`, `004_loop_admin_controls.sql` and `005_loop_banner_studio.sql`; configure Auth redirect URLs and test with separate accounts before enabling real users. Sample products and review cards are design previews, not live listings or verified testimonials. The live publish handler requires the database and Storage policies to be correct. Phone/call reveal, paid promotion checkout, payment verification and ad serving are not implemented. Do not take payments or announce a full public launch until these integrations and checks are complete.
