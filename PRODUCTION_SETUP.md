# Bech De — production setup and launch gates

## What is in this repository
- Mobile-first homepage and seller/product pages.
- Optional price-offer and per-listing bidding UI.
- Supabase SQL foundation for listings, profiles, offers, bids, reports, conversations, messages, favorites, notifications, blocks and promotion orders.
- A server-side bid function that serializes bids on the listing row.

## Required external setup (cannot be completed from GitHub alone)
1. Create a Supabase project under the owner's account and keep the Project URL and publishable/anon key available for `assets/config.js`.
2. Run `supabase/schema.sql`, then `supabase/002_marketplace.sql` in the Supabase SQL editor.
3. Configure Auth providers and redirect URLs for the final production domain.
4. Create a private Storage bucket `listing-photos`. Add upload/read policies that restrict uploads to authenticated owners, enforce image MIME types and size limits, and prevent arbitrary object overwrites.
5. Configure email/phone verification and recovery.
6. Build/deploy trusted server endpoints for payment provider order creation and signed webhook verification; only trusted server code may mark promotions paid or activate a boost.
7. Configure scheduled auction closing, notifications, reports/admin review and retention/deletion jobs.
8. Run security review and integration tests with two buyer accounts, two seller accounts, a seller attempting to bid on own listing, simultaneous bids, expired auctions, blocked users and invalid payment webhooks.
9. In GitHub repository Settings → Pages, select **GitHub Actions** as the source; the workflow in `.github/workflows/pages.yml` will deploy the static frontend on pushes to `main`. Configure the final domain and HTTPS, then run smoke tests on mobile/desktop.

## Secrets and configuration
Do not commit Supabase service-role keys, payment secrets, SMTP/SMS secrets or admin credentials to GitHub. Public Supabase URL and publishable/anon key may be used in the browser only after RLS policies are reviewed. Store server secrets only in deployment environment variables.

## Launch blocker status
The HTML pages now contain Supabase integration code and a GitHub Pages deployment workflow, but `assets/config.js` still has placeholder credentials. The database SQL has not been applied to a real project from this repository. Therefore live signup, listing persistence, real chat, offers/bids across users and moderation remain inactive until the owner configures Supabase, applies and reviews both migrations, adds the owner to `admin_roles`, and tests with separate accounts. Paid promotion checkout and ad serving are still not implemented. Do not take payments or announce a full public launch until those integrations and checks are complete.
