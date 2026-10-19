# LOOP — Good things go around.

An India-first classifieds marketplace prototype. **The buyer and seller make the deal directly; LOOP is the discovery and connection platform.**

## Agreed business model
- Seller creates their own listing and uploads genuine photos of the actual item. No AI-generated product photos.
- Seller provides title, category, condition, asking price and location.
- Buyer discovers listings, then contacts the seller through chat or call.
- Buyer and seller negotiate and decide independently on inspection, price, payment and handover.
- LOOP does not manage routine deals, collect the item, or arrange every delivery.
- Revenue: clearly labelled advertising and paid/promoted listings.
- Fixed price is the default. Sellers can optionally accept price offers and/or enable bidding per individual listing; bidding must be attached to that product, not a site-wide mode. Auction start/end/reserve settings are listing-level.
- Revenue: optional paid listing boosts and clearly labelled advertising; do not charge for ordinary direct negotiation by default.

## Frontend and backend integration status
- `index.html`: responsive homepage with search, category/price/condition filters; loads active listings from Supabase when configured.
- `seller.html`: photo upload and publish flow; optional offers/bidding settings per listing.
- `product.html`: listing detail, offers, server-enforced bids, chat entry and report listing.
- `auth.html`: passwordless email sign-in.
- `account.html`: seller listings, buyer offers/bids, conversations and seller offer responses.
- `messages.html`: authenticated buyer–seller message thread.
- `admin.html`: admin-role-gated report moderation.
- `supabase/schema.sql` and `supabase/002_marketplace.sql`: initial database/RLS foundation.
- `assets/config.js`: public Supabase project URL and publishable key configured for project `osalvxajhkgisxisntww` (never add a secret/service-role key).
- `assets/marketplace.js` and `assets/admin.js`: browser-side Supabase integrations.
- `PRODUCTION_SETUP.md`: setup instructions and launch blockers.

## Launch status — not production ready yet
LOOP is an evolving marketplace build. Seller login, real photo uploads, persistent listings and seller-first chat are wired to Supabase and depend on the current SQL migrations, provider setup and row-level security policies being applied. Homepage sample products and sample review cards are design previews, not live offers or verified customer reviews. Banner Studio requires `supabase/005_loop_banner_studio.sql`. Paid promotion checkout, signed payment webhooks, ad-serving monetization and verified transaction reviews are not yet production-complete.

## Run
Open `index.html` in a browser, or enable GitHub Pages for a hosted static preview.

## Required before public launch
1. **Backend/database:** persistent accounts, listings, categories, location, image storage, listing status and deletion.
2. **Authentication and access control:** verified email/phone, secure sessions, rate limits, server-side admin authorization and recovery flows.
3. **Contact:** real in-app chat, user-initiated call/contact reveal, blocking and reporting.
4. **Offers and product-level bidding:** seller controls per listing; server-side validation, bid history, atomic highest-bid updates, close time enforcement, anti-sniping policy, reserve-price handling, seller/buyer notifications, cancellation/dispute rules and audit trail. Do not run real auctions with browser-only state.
5. **Revenue:** paid boost checkout, payment provider/webhook verification, receipts/refunds/tax handling and clearly labelled ad inventory. Do not fake paid status in the browser.
6. **Trust and safety:** restricted-item policy, report queue, spam/abuse handling, image moderation process, safe-meetup advice and account suspension workflow.
7. **Legal/privacy:** Terms of Use, Privacy Policy, listing rules, auction rules, contact-data consent, data deletion process and India-specific legal/tax review.
8. **Quality/reliability:** responsive and accessibility checks, broken-link and form validation tests, security review, backups, error monitoring, SEO/social metadata and production domain/HTTPS.
9. **Operations:** support contact, incident process, owner dashboard connected to real records, automated alerts for serious reports only.

## Current working demo behavior
- Homepage search/category filtering and price/condition sorting work on illustrative sample listings.
- Seller Studio previews an item and optional offer/bidding settings locally; nothing is published.
- Product page can demonstrate offer and bid input locally when opened with demo query parameters; no real offer or bid is transmitted.

## Run
Open `index.html` in a browser, or enable GitHub Pages for a hosted static preview. GitHub Pages alone cannot provide real accounts, private chat, secure payments, or authoritative auctions.
