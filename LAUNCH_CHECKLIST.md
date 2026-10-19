# LOOP — launch checklist

LOOP now has a deployed, mobile-first frontend with Supabase-connected listing, account and chat flows plus an owner Banner Studio. Before public launch, apply the required SQL migrations and complete the security, upload, auth and two-account smoke tests. Demo product cards and example reviews must remain labelled as previews until replaced with live listings and verified reviews.

## Product decisions
- Fixed-price listings are the default.
- Seller can optionally enable **price offers** and/or **bidding per individual product**.
- Auction start/end, starting bid and optional reserve belong to that listing.
- Buyer and seller arrange inspection, payment and handover directly.
- Revenue: paid boosts and clearly labelled ads. Normal listings remain simple.
- Product photos must be genuine seller-uploaded photos.

## Suggested production stack
- Frontend: this repository, served over HTTPS on a custom domain.
- Backend: Supabase Auth + PostgreSQL + Storage + Realtime, with Row Level Security.
- Payments: choose a supported India payment provider; verify every payment on the server using signed webhooks before marking a listing promoted.
- Notifications: verified email/SMS provider, rate limits and unsubscribe controls.

## Setup sequence
1. The project URL and publishable key are configured in `assets/config.js` for project `osalvxajhkgisxisntww`. Never put an `sb_secret_...` or `service_role` key in frontend code.
2. Review and run `supabase/schema.sql`, `supabase/002_marketplace.sql`, `supabase/004_loop_admin_controls.sql`, and `supabase/005_loop_banner_studio.sql` in the Supabase SQL Editor. Do not assume they have been applied just because the frontend key is configured.
3. The migration creates a public-read `listing-photos` bucket with per-user-folder upload rules. Confirm the bucket and policies exist after applying SQL; validate uploads from a signed-in test account.
4. Test signup/login, verified email, profile recovery, create/list flow, owner listing removal and live listing retrieval from two different accounts.
5. Implement offers with seller-only accept/decline actions and buyer/seller notifications. Enforce permissions and valid status transitions on the server.
6. Implement bidding via the `place_bid` database function, with server-side auction opening/closing, clear increment rules, close notifications, reserve rules, anti-sniping policy, abuse protection and audit history. The browser must not be the authority for bid state.
7. Add paid promotions only after server-verified checkout/webhooks, refunds, invoices and taxes are handled. Do not accept payment card details directly.
8. Test the owner-only moderation and Banner Studio tools for reports, listing status, image/video uploads, placement, scheduling and deletion. Ensure admin restrictions are enforced server-side.
9. Publish reviewed Terms, Privacy Policy, prohibited-items rules, auction rules, contact-data consent, deletion/retention process and support contact. Obtain India-specific legal/tax advice.
10. Test mobile, accessibility, search/filter, upload abuse, auth/session security, RLS policies, auction concurrency, payment webhook replay, backups and recovery. Then deploy to HTTPS and run smoke tests.

## Current gaps
The public Supabase credentials are now configured, but backend readiness has not yet been verified. The site still depends on the SQL migrations, Auth redirect/provider settings, correct RLS/storage policies and multi-account smoke tests. Phone/call reveal, paid promotion checkout/payment verification and ad serving are not implemented. GitHub Pages can host the static preview but cannot replace the secure backend.

## Banner Studio checks
- The owner allow-list must be exactly `ankitmisra489@gmail.com` (no extra `h` in `misra`).
- Run `supabase/005_loop_banner_studio.sql` to create the banner table, public asset bucket and owner-only upload/update/delete policies.
- Choose homepage top, homepage after-listings or a specific category, then inspect both desktop and mobile previews before publishing.
- Upload JPG/PNG/WebP images up to 8 MB or MP4/WebM videos up to 25 MB and five seconds. Sample reviews must never be presented as verified customer reviews.

## Auction safety notes
A production auction needs a reviewed policy for minimum increments, ties, cancelled/removed listings, seller cancellation, reserve price, bidder privacy, collusion, last-second bidding, time zones, failed notifications and dispute handling. The included schema is a starting point, not a complete audited marketplace backend.
