# Bech De 2.0 — Find it. Sell it. Bech De.

An India-first classifieds marketplace prototype. **The buyer and seller make the deal directly; Bech De is the discovery and connection platform.**

## Agreed business model
- Seller creates their own listing and uploads genuine photos of the actual item. No AI-generated product photos.
- Seller provides title, category, condition, asking price and location.
- Buyer discovers listings, then contacts the seller through chat or call.
- Buyer and seller negotiate and decide independently on inspection, price, payment and handover.
- Bech De does not manage routine deals, collect the item, or arrange every delivery.
- Revenue: clearly labelled advertising and paid/promoted listings.
- OpenBid auctions are optional; regular classifieds/fixed-price listings are the default.

## Current frontend prototype
- `index.html`: responsive marketplace home, search, category filters, sample listings, contact actions, real-photo upload preview and listing type selector.
- `workflow.html`: visual end-to-end business workflow, owner responsibilities and revenue model.
- `product.html`: product details and optional OpenBid demo.
- `seller.html`: Seller Studio demo.
- `admin.html`: Admin console demo.
- `app.css`: shared supporting-page styles.

## Important limitations
This is not yet a production marketplace. Listings and upload preview are local demo interactions; photos are not uploaded to a server. Chat, calling, login, persistent listings, paid promotion checkout, ad serving, moderation, and auction state are not connected to a backend. Sample products and seller identities are illustrative.

## Run
Open `index.html` in a browser, or enable GitHub Pages for a hosted static preview.

## Next build stages
1. Backend and database for accounts, listings, genuine image uploads and reporting.
2. Authentication, chat and privacy-aware seller contact.
3. Promoted listing checkout and ad provider integration.
4. Moderation, spam controls, audit logs and admin tools.
5. Optional real-time OpenBid service with server-enforced auction rules.
