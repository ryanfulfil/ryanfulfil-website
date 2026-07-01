# RyanFulfil Website — Claude Handoff Document
*Generated 2026-07-01 for continuity when switching to a new Claude session*

---

## 1. PROJECT OVERVIEW

**What it is:** Static HTML/CSS/JS website for RyanFulfil, a China-based dropshipping fulfilment agent. Hosted on GitHub Pages.

**Live URL:** https://ryanfulfil.github.io/ryanfulfil-website/

**Workspace folder:** `G:\My Drive\Hong Wei\Shipping\Ryanfulfil\GitHub Website\ryanfulfil-website`

**No build system** — edit HTML/CSS/JS files directly. Changes go live when pushed to GitHub.

**Owner:** Hong Wei (redroost88@gmail.com), Founder of RyanFulfil

---

## 2. SITE STRUCTURE

```
index.html              — Homepage (main landing page)
faq.html                — FAQ page (most heavily maintained)
services.html           — Services page
how-it-works.html       — How It Works page
why-ryanfulfil.html     — Why RyanFulfil page
contact.html            — Contact page
blog/                   — Blog posts
games/                  — Game Demos (interactive demos)
games.html              — Game Demos index
privacy-policy.html     — Privacy Policy
terms-of-service.html   — Terms of Service (NOT terms.html)
sitemap.xml
robots.txt
og-image.jpg            — OG social share image (1200×630px)
```

---

## 3. CSS DESIGN TOKENS

```css
--navy:   #0D1F3C   /* Dark navy — primary bg for hero, footer, nav */
--accent: #2AAEF5   /* Blue — CTAs, links, highlights */
--white:  #FFFFFF
--surface:#F0F7FF   /* Light blue — alternating section bg */
--muted:  #64748B   /* Grey — secondary text */
--border: #E2E8F0   /* Light grey — card borders */
```

---

## 4. KEY BUSINESS FACTS (verified, use as source of truth)

- **Operating since:** 2018
- **Warehouse:** Guangzhou, China
- **Ships to:** 150+ countries (147 destinations listed in shipping table)
- **Couriers:** 4PX, 云途 (YunTu), 万邦 (Wanbang)
- **Community:** 3.4M+ members across 10 Facebook groups
- **Orders:** 5,000+ fulfilled daily

**Shipping model:**
- DDP (Delivered Duty Paid) is standard for the vast majority of routes — customer doesn't pay duties at the door
- NOT absolute — a few jurisdictions diverge; when they do, Hong Wei sounds it out
- IOSS covers EU orders under €150 for import VAT

**Countries requiring customer ID for customs clearance:**
- Turkey — TC Kimlik No (national ID)
- Chile — RUT (tax ID)
- Brazil — CPF (individuals) / CNPJ (businesses)
- South Korea — PCCC (Personal Customs Clearance Code)
- Argentina — CUIL (tax ID)

**Currencies accepted:**
- No surcharge: USD, EUR, GBP, CAD, AUD, NZD, SGD
- Small FX surcharge: TRY (Turkish Lira), HUF (Hungarian Forint) — reason: higher conversion losses on these two vs the rest
- Payment via: Wise or bank transfer

**Platform integrations:**
- Shopify: full two-way auto (pull orders → fulfil → upload tracking → triggers customer notification). Via Shopify collaborator access — no staff account needed.
- WooCommerce: full two-way auto (same as Shopify). Via WooCommerce settings authorisation. **DO NOT mention "Dianxiaomi" publicly** — it's the internal tool used but must not appear on the site.
- TikTok Shop, eBay, Etsy: tracking numbers sent to seller manually to update their side.

**CRITICAL — Do NOT mention Dianxiaomi on the website or in any public copy.**

---

## 5. BRAND POSITIONING

**Two prospect segments:**

1. **AliExpress upgraders** — motivations vary: want automated fulfilment, cheaper than AliExpress, no AliExpress packaging, faster shipping, custom branding, etc.

2. **Agent-switchers** (switching from another fulfilment agent) — motivated by something *breaking* at their current agent: unresponsive, product quality issues, slow shipping, not solving problems. **Price is NOT the switching trigger** — if they claim they want cheaper, they'll just renegotiate with their current agent. What closes them is responsiveness and reliability.

**Hero subheadline (current):**
> "Think of us as your ops desk in China — real people on WhatsApp who pick up when something goes wrong. We source, check, pack, and ship direct to your customers worldwide."

This was specifically crafted to address both segments — the "pick up when something goes wrong" line speaks to agent-switchers; the rest covers AliExpress upgraders.

**Brand voice:** Direct, confident, no fluff. "China-side ops desk." Not a platform, not a ticket system — real people.

---

## 6. ALL CHANGES MADE IN PREVIOUS SESSIONS (completed)

### faq.html

**Currency FAQ (id="faq-currency"):**
- Accepted currencies: USD, EUR, GBP, CAD, AUD, NZD, SGD (no surcharge); TRY and HUF (small FX surcharge — higher conversion losses)
- Both JSON-LD and HTML body updated

**Platforms FAQ (id="faq-4"):**
- Shopify + WooCommerce = fully automatic (pull orders → fulfil → tracking upload → triggers store notification)
- TikTok Shop, eBay, Etsy = tracking sent to seller to update manually

**Shopify/WooCommerce connection FAQ (id="faq-shopify"):**
- Button text: "How do I connect my Shopify or WooCommerce store?"
- Covers both platforms' connection process; WooCommerce: "orders flow automatically in both directions — no manual uploads or copy-pasting"

**Tracking FAQ (id="faq-10"):**
- Shopify + WooCommerce: fully automatic — tracking uploads trigger store's shipping confirmation email
- Other platforms: tracking sent to seller

**Customs/DDP FAQ (id="faq-customs"):**
- Softened from absolute "all customs pre-paid, customer NEVER pays" to "standard routes, vast majority of destinations"
- Added customer ID requirement section listing Turkey, Chile, Brazil, South Korea, Argentina with their specific ID types

**5 New FAQs added (JSON-LD + HTML):**
- `faq-sample` — Can I order a sample first? (Getting Started section)
- `faq-own-stock` — Can I send my own stock to you? (Getting Started section)
- `faq-sensitive` — Do you handle sensitive or restricted products? (Sourcing & Pricing section)
- `faq-parcel-contents` — What goes inside the parcel? (Branding & Scaling section)
- `faq-made-in-china` — Will my customer know it's from China? (Branding & Scaling section)

### services.html

**Mobile white-on-white bug fix** (inside `@media (max-width: 600px)`):
```css
.data-table tbody tr:nth-child(even) td { background: none; }
.data-table tbody tr:nth-child(even) td:first-child { background: var(--navy); }
```
Root cause: CSS specificity conflict. Even-row reset (0,2,3 specificity) was overriding navy first-cell (0,2,1). Fixed by adding rule with (0,3,3) specificity.

**Warehouse claim softened:**
- Old: "US, UK, EU, and Japan warehouse partners available for faster local delivery"
- New: "Overseas warehouse options (US, UK, EU, Japan) may be available through partners for proven products at suitable volumes — ask us"

### how-it-works.html

**Mobile white-on-white bug fix** (same issue, same fix pattern):
```css
.data-table tr:nth-child(even) td { background: inherit; }
.data-table tr:nth-child(even) td:first-child { background: var(--navy); }
```

### index.html

**Hero subheadline updated** (see Section 5 above for new text)

**Trust bar currency:**
- Old: "Payments in USD, EUR, GBP, SGD"
- New: "Payments in USD, EUR, GBP, SGD & more"

**Pricing section payment line:**
- New: "Payment via Wise or bank transfer. We accept USD, EUR, GBP, SGD, CAD, AUD, NZD, and more — see the FAQ for full currency details."

---

## 7. PENDING ITEMS (not yet done — do these next)

### HIGH PRIORITY

**A. Badge text fix on index.html**
- Find: `3.4M+ community following`
- Replace with: `3.4M+ seller community`
- (Current text is unclear — "community following" sounds like a social media follower count; "seller community" is more accurate)

**B. Accordion use-case descriptions on index.html**
- Section: "From testing to scaling, we have your backend covered"
- Currently has 6 accordion items that are fully collapsed with only headings — no preview text
- Visitors won't click unless headings alone are compelling enough
- Fix: add a one-line description under each heading so visitors understand what's inside before clicking
- Items: Testing a product / Scaling a winner / Building a brand / Switching from another agent / Managing multiple SKUs / Connecting your store

### LOWER PRIORITY (confirm with Hong Wei first)

**C. PayPal/Payoneer FAQ**
- Codex suggested adding this
- Only add if Hong Wei confirms he gets asked about it regularly (not yet confirmed)

**D. Factory-reality-check USP copy**
- Codex suggested adding "Before you spend on ads, we check factory availability..." type copy to Services/Homepage
- Not yet implemented; worth discussing

---

## 8. VISUAL LAYOUT ASSESSMENT (done 2026-07-01)

Full homepage review completed via browser screenshots. Findings:

**Works well:**
- Hero: strong headline, social proof badges, prominent CTAs
- Trust bar: good compression of key credentials
- "What's included" 6-card grid: best section on the page, punchy copy
- Shipping table: interactive/searchable, very professional, competitive differentiator
- Community section: Facebook group member counts are impressive social proof
- Footer: clean and well-organised

**Issues identified:**
1. Two card grids back-to-back ("What's included" → founder quote → "What RyanFulfil handles") feel repetitive visually. Second grid (Product Sourcing / Order Fulfilment / Custom Branding) has weaker copy than the first.
2. Accordion use-cases are all collapsed — no preview. Needs one-line descriptions (= Pending Item B above).
3. Badge text fix pending (= Pending Item A above).
4. The orange 1688 floating icon on the right is a browser extension overlay — not real website content, clients won't see it.

---

## 9. IMPORTANT TECHNICAL NOTES

**FAQPage JSON-LD schema** in faq.html must always be kept in sync with the visible HTML. Both live in the same file — when editing FAQ content, update BOTH the JSON-LD block (near top of file) AND the HTML body section.

**Terms of Service file** is `terms-of-service.html` — NOT `terms.html` (that file doesn't exist).

**Mobile data-table specificity pattern:** When adding CSS rules for mobile overrides to `.data-table`, be careful with specificity. Even-row rules have high specificity (0,2,3) that can override first-child navy background rules. Always test the fix by adding a higher-specificity rule targeting `td:first-child` explicitly.

**The live site caches.** After pushing to GitHub, changes may not appear immediately in the browser. Hard refresh (Ctrl+Shift+R) or wait a few minutes.

---

## 10. WHAT TO TELL CLAUDE SONNET 5

Paste this entire document as context at the start of the new session. Then say:

> "Continue working on the RyanFulfil website. The workspace folder is G:\My Drive\Hong Wei\Shipping\Ryanfulfil\GitHub Website\ryanfulfil-website. Start with the pending items in Section 7 of this document — first the badge text fix (7A), then the accordion descriptions (7B)."

---

*End of handoff document*
