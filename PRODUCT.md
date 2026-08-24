# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Customer (primary, unauthenticated).** Someone who wants a haircut and is holding a phone. They arrive from search, a shared link, or the shop's own channels, and they will not create an account to book. The job is: pick a service, pick a barber or accept whoever is free, pick a time that actually exists, leave a name and phone, and get out. Afterwards they need one link that lets them see, reschedule, or cancel the appointment without a password.

**Shop owner / staff (secondary, authenticated).** The person running the floor, working between clients on a phone or tablet, occasionally at a desk. The job is: see who is next, absorb changes (a no-show, a walk-in, a barber calling in sick), and keep the shop's configuration true — services, prices, barbers, hours, breaks, closures, booking rules, and the public site's look and content.

Owner and customer are the same product but not the same experience: the customer surface is a storefront, the admin surface is an instrument panel.

## Product Purpose

Grooma gives a barber shop its own booking-capable web presence and the tools to run the day behind it. It removes the phone call and the paper book from the middle of the transaction: the customer sees genuine real-time availability rather than a request form, and the owner gets a confirmed schedule rather than a stack of messages to reconcile.

Success is measured on both sides. For the customer, a booking completed on a phone, first try, without hesitation about whether it went through. For the owner, a day that can be run entirely from the dashboard, and configuration changes that take effect without asking anyone for code.

## Positioning

Three things a neighboring booking tool could not truthfully claim:

1. **Availability is computed, not promised.** Open slots are derived server-side from working hours, breaks, closures, service duration, and booking rules — and double-booking is prevented by a Postgres exclusion constraint plus a transactional recheck, not by hopeful UI. The scheduling engine is a pure module under exhaustive unit tests, including a race-condition proof.
2. **The shop's brand, not the vendor's.** Every tenant-facing aspect — theme, homepage sections, services, copy, hours, locale — is data. A shop reconfigures its entire public presence without a deploy and without touching source.
3. **Multi-tenant from the schema up.** Tenant isolation is a server-enforced security property, never frontend filtering. The product serves one shop today on a core built for many.

## Operating Context

- **The customer's scene:** a phone, often one-handed, often on mobile data, often mid-scroll. Booking is a two-minute interruption of something else. There is no second attempt if the first is confusing.
- **The owner's scene:** standing, interrupted, hands sometimes occupied. Admin sessions are short and repeated rather than long and focused. Glanceability outranks density; a mis-tap during a haircut is expensive.
- **Locale and money:** Nepal is the operating market. Timezone defaults to `Asia/Kathmandu` and is configurable per shop. Currency defaults to `NPR`, stored as integer minor units (paisa). Nepali formatting uses `ne-NP` with Devanagari digits where natural.
- **Booking is guest-first.** Post-booking access is a secure token link, not an account. Any flow that assumes a logged-in customer is wrong.
- **Historical truth:** every appointment snapshots the price and duration in force at booking time, so later config edits never rewrite the past.

## Capabilities and Constraints

**Public surfaces:** home, services, barbers, booking wizard (`/book`), appointment lookup and manage-by-token, ICS calendar export. **Admin surfaces:** dashboard, calendar (today / day timeline / week / mobile list), appointment detail and lifecycle actions, customers, and settings for services, barbers, schedule, rules, general, appearance, and homepage. A `/style` route holds the design-system showcase.

- **Both languages are first-class.** `en` and `ne` via typed dictionaries and `[locale]` routing. Every surface must be designed and reviewed in both. Devanagari line height, ascender and descender behavior, and Nepali copy length are design constraints, not localization cleanup.
- **Theme engine.** Shop data drives CSS custom properties; seven presets ship (`classic-barbershop`, `midnight`, `minimal`, `copper`, `emerald`, `ocean`, `editorial`) alongside custom themes. A contrast module exists specifically so a custom theme can never render essential UI unreadable. Any new component must theme through tokens — hardcoded color is a defect, not a shortcut.
- **iOS HIG-inspired interaction on the web.** Haptics, sound, and motion primitives exist in `src/lib`. This is a web product; the iOS influence is interaction feel, not a native design language.
- **Not yet built:** notifications (in-app center, Resend email), PWA offline shell and install polish, and SEO/AEO/GEO metadata are planned but unimplemented. `TRACKER.md` currently understates progress — phases 9 through 11 are committed but still listed as not-started.

## Brand Commitments

- **Product name:** Grooma. **Tagline:** "Your grooming, made simple."
- **Grooma is infrastructure, not the face.** The public-facing site wears the barber shop's brand — its name, its logo, its colors. Grooma is invisible to the customer. The theme engine is therefore the shop's identity mechanism, not a decoration layer, and it must be capable of carrying a real brand rather than tinting a generic one.
- **Grooma's own design voice lives in the admin.** That is the one surface where the product, not the tenant, is speaking.
- No other identity constraints, reference brands, or voice guidelines have been set.

## Evidence on Hand

- **A real barber shop is the first tenant.** Its actual name, location, services, prices, and barbers exist and will be supplied by the project owner. Until they land, everything visible is placeholder.
- **The `democlassic` seed is a stand-in.** Its shop name, prices, hours, barber names, and sample appointments are demo fixtures. Never quote them as facts about a real business, and never carry them into marketing copy or screenshots presented as real.
- **`public/` is empty.** No logo, no shop photography, no barber portraits exist yet. Real assets are coming from the user. Design leaves genuine, correctly shaped slots for them and does not fabricate substitutes or generate stand-in imagery presented as the shop's.
- **Nothing else exists.** No testimonials, reviews, ratings, customer counts, press mentions, benchmarks, or partner logos. Do not invent any of them, in any surface, at any fidelity.

## Product Principles

1. **Correctness is the feature.** A beautiful booking flow that offers an unavailable slot has failed completely. Where visual ambition and scheduling truth conflict, truth wins and the design works around it.
2. **The customer never has to commit to use.** No account, no password, no app install as a precondition. Every flow degrades to: a phone, a link, and two minutes.
3. **The shop is the brand; Grooma is the plumbing.** Public design must hold its quality under someone else's colors, someone else's name, and content the shop typed itself.
4. **Configuration replaces code changes.** If a shop would need a developer to change it, it belongs in data. New features arrive with their admin surface, not after it.
5. **Built for the interrupted.** Both users are mid-something. Design for glance, resumption, and mis-taps — not for undivided attention.

## Accessibility & Inclusion

Target is **WCAG 2.2 AA**, with Lighthouse accessibility 95+ on public pages as the shipping gate. Keyboard sweeps, reduced-motion verification, and accessible forms, dialogs, sheets, and toasts are explicit requirements. The theme engine's contrast validation exists to keep tenant customization from breaking this. Both `en` and `ne` are in scope for every accessibility check.
