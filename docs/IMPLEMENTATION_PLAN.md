# Implementation Plan

Barber Appointment System

Version: 1.0
Date: 2026-08-23
Source spec: `initial-idea.md`
Status tracker: `TRACKER.md` (updated after every work session)

---

## 1. Summary

Build a production-quality barber appointment and shop management application following the master spec in `initial-idea.md`.

Deployment model for this build: single shop in operation, with the data model and data access layer fully shop-scoped from day one so a second shop can be added later without rewriting business logic.

Design direction: Apple Human Interface Guidelines inspired interaction patterns delivered on the web. Clarity, deference, depth, large titles, grouped lists, bottom sheets, spring motion, press feedback, haptics, and restrained sound cues.

---

## 2. Scope Adjustments From the Original Spec

| Original spec                            | This build                                                                          | Reason                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Multi-tenant SaaS with many live shops   | One live shop, tenant-aware schema                                                  | Owner request. Add shops later without refactoring                        |
| Slug based public routing `/shop/[slug]` | Root level public routes (`/`, `/book`) resolved against the single configured shop | Cleanest URLs for a single shop deployment. Upgrade path documented below |
| Platform onboarding wizard               | Deferred. New shop = new row plus environment variable                              | Onboard a second shop through data, not code                              |
| Full notification suite                  | In-app center plus transactional email architecture                                 | Spec section 35 allows staged rollout                                     |

### Tenancy upgrade path (documented contract)

1. Every table that belongs to a shop carries `shop_id` with a foreign key to `shops`.
2. Every query runs through `src/db/repositories` functions that require an explicit `shopId` parameter. No raw tenant-unscoped selects in feature code.
3. `getShopContext()` in `src/lib/tenant.ts` is the single place that resolves the active shop. Today it reads `DEFAULT_SHOP_SLUG` from the environment. Tomorrow it can resolve by subdomain, host header, or path segment.
4. Server actions and route handlers always derive `shopId` from context, never from client input.

Adding a real second shop later requires only one of:

- Option A: a second deployment with its own `DATABASE_URL` and `DEFAULT_SHOP_SLUG`. Zero code changes.
- Option B: true multi-tenant mode. Add `[slug]` segments or host based resolution inside `tenant.ts`, then move public routes under a slug segment. Business logic is untouched because it is already scoped.

---

## 3. Technology Stack

Locked choices with rationale. Deviations require updating this document first.

| Layer      | Choice                                                   | Notes                                                                                                                  |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Framework  | Next.js 16, App Router, React 19                         | Server Components by default                                                                                           |
| Language   | TypeScript, strict mode                                  | Non-negotiable                                                                                                         |
| Styling    | Tailwind CSS v4 with CSS custom property tokens          | Semantic tokens only in components                                                                                     |
| UI kit     | shadcn/ui patterns on Radix primitives, Lucide icons     | Restyled to our design system, never stock look                                                                        |
| Animation  | Motion for React                                         | Springs, shared layout, reduced-motion aware                                                                           |
| Database   | PostgreSQL (Neon in prod, Docker locally)                |                                                                                                                        |
| ORM        | Drizzle ORM + drizzle-kit migrations                     | Matches team experience                                                                                                |
| Validation | Zod                                                      | Shared schemas for forms and server boundaries                                                                         |
| Forms      | React Hook Form + @hookform/zod                          |                                                                                                                        |
| Auth       | Better Auth with Drizzle adapter, email and password     | Roles: OWNER, BARBER. Extensible. Team has production WebAuthn experience with this stack if passkeys are wanted later |
| Dates      | date-fns + @date-fns/tz                                  | Explicit timezone handling, default Asia/Kathmandu per shop setting                                                    |
| Email      | Resend behind a NotificationService abstraction          | Providers pluggable                                                                                                    |
| PWA        | Serwist                                                  | Reevaluate at Phase 11 if compatibility drifts                                                                         |
| Storage    | URL-based image fields first, provider abstraction later | Cloudinary or S3 compatible in polish phase                                                                            |
| Testing    | Vitest (unit, especially scheduling), Playwright (E2E)   |                                                                                                                        |
| Quality    | ESLint, Prettier, GitHub Actions, pnpm                   | Lint, typecheck, test, build on every PR                                                                               |
| Deployment | Vercel + Neon                                            |                                                                                                                        |

---

## 4. Architectural Decisions

### AD-01: Single shop runtime, tenant-aware core

Covered in section 2. The word "hardcoded" is banned near business data. All names, hours, prices, and content come from the database.

### AD-02: Availability is computed, never stored

No slot tables. The engine derives slots from working hours, appointments, breaks, closures, and booking rules on demand. See section 6.

### AD-03: Double-booking prevention at the database level

Primary guard: a Postgres exclusion constraint on appointments:

```sql
EXCLUDE USING gist (
  barber_id WITH =,
  tsrange(start_time, end_time) WITH &&
) WHERE (status IN ('PENDING', 'CONFIRMED'))
```

Secondary guard: booking mutations run inside a transaction that revalidates availability immediately before insert. The constraint is the safety net when two requests race.

### AD-04: Timezone discipline

- Timestamps stored as `timestamptz` in UTC.
- Working hours, breaks, and rules are wall-clock strings interpreted in `shop.timezone`.
- All date math uses `@date-fns/tz` zone aware APIs. No naive `Date` parsing of schedule strings.
- Default shop timezone: `Asia/Kathmandu`, configurable per shop.

### AD-05: Historical snapshots

Appointments copy `serviceNameAtBooking`, `priceAtBooking`, `durationAtBooking`, `barberNameAtBooking` at creation. Editing a service never rewrites history.

### AD-06: Guest-first booking

No account required. Name and phone required, email and notes optional. Appointment access through secure lookup codes (random 32 character token, shown once as a short link), not guessable sequential IDs.

### AD-07: iOS HIG interaction contract

The design system enforces these patterns so screens stay consistent:

- Typography: Geist Sans (SF-like), tight tracking on large titles, Dynamic Type friendly rem scale
- Layout: inset grouped card sections, hairline separators, generous spacing
- Navigation: mobile bottom tab bar with blur material, desktop sidebar in admin
- Sheets: bottom sheets with grabber on mobile, centered dialogs on desktop, spring transitions
- Controls: segmented controls for exclusive choices, iOS style switches, large touch targets (min 44px)
- Feedback: press scale 0.97 on interactive elements, haptics via Vibration API where supported, optional micro sounds via WebAudio synthesis (no audio assets), all behind a user preference and disabled with `prefers-reduced-motion`
- Color: semantic tokens mapped to light and dark appearances, no raw hex in components

### AD-08: Server boundary contract

Every mutation follows: validate input with Zod, resolve shop context, authenticate where required, authorize role, execute in transaction, return a serializable result object. Client never receives raw database rows.

---

## 5. Data Model Outline

Operational entities are relational. Shop appearance and content live in typed JSONB columns on `shops` to keep iteration cheap, promoted to tables later only if truly needed.

```text
shops              id, slug, name, short_name, tagline, description,
                   contact (jsonb), location (jsonb), social (jsonb),
                   branding (jsonb: logo url, favicon url, theme preset id, custom theme jsonb),
                   homepage (jsonb: ordered enabled sections with content),
                   booking_rules (jsonb: slot_interval_min, min_notice_min, max_advance_days,
                                  cancel_deadline_min, reschedule_deadline_min),
                   timezone, currency, locale, created_at, updated_at

users              id, name, email, password_hash, role, shop_id, created_at

services           id, shop_id, name, description, duration_min, buffer_min,
                   price_cents, image_url, active, display_order, timestamps

barbers            id, shop_id, user_id nullable, name, display_name, bio,
                   photo_url, active, display_order, timestamps

barber_services    barber_id, service_id (composite pk)

working_hours      id, shop_id, barber_id nullable (null = shop level), weekday,
                   intervals jsonb [{start:"09:00", end:"13:00"}]

breaks             id, shop_id, barber_id nullable, kind RECURRING | ONE_OFF,
                   weekday nullable, date nullable, start_time, end_time, reason

closures           id, shop_id, barber_id nullable, date or range, full_day bool,
                   start_time nullable, end_time nullable, reason

customers          id, shop_id, name, phone, email, notes, timestamps

appointments       id, shop_id, customer_id, barber_id, service_id,
                   start_time, end_time, status enum(PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW),
                   service_name_snapshot, barber_name_snapshot,
                   price_at_booking_cents, duration_at_booking_min,
                   customer_notes, admin_notes, cancel_reason,
                   lookup_token_hash, source enum(ONLINE, ADMIN, WALK_IN),
                   timestamps
                   exclusion constraint per AD-03

notifications      id, shop_id, audience CUSTOMER | ADMIN, user_id nullable,
                   appointment_id nullable, type, payload jsonb, read_at, created_at

email_log          id, shop_id, to_email, template, payload jsonb, status, error, created_at
```

Indexes: `shop_id` on every scoped table, `appointments(shop_id, start_time)`, `appointments(barber_id, start_time)`, `appointments(customer_id)`, `customers(shop_id, phone)` unique-ish handling, `services(slug-safe ordering)` and `slug` unique on shops.

Money stored as integer cents/minor units. Currency string per shop, default NPR.

---

## 6. Scheduling Engine Design

Location: `src/lib/scheduling/` as pure, dependency-free functions with heavy Vitest coverage.

```text
types.ts         Interval, DaySchedule, BookingRules, AvailabilityInput, Slot
interval.ts      overlap, merge, subtract, containment math on minute ranges
hours.ts         expand working hours for a date in a zone, apply breaks and closures
slots.ts         generate candidate slots at rule interval, filter by duration + buffer
availability.ts  getAvailability(input): Slot[] composing everything above
rules.ts         notice period, advance window, deadlines checks
format.ts        wall-clock helpers, zone conversions
```

`getAvailability` input: shopId, date, serviceId, barberId or ANY, plus loaded records. Output: slots with `available` flags and reasons for disabled states (useful UX: "closes soon").

Booking transaction in `src/actions/appointments.ts`:

1. Validate Zod input
2. Load shop, service, barber, rules
3. Recompute availability for requested start inside the transaction
4. Insert appointment
5. Exclusion constraint rejects any race loser, mapped to the polished "just booked" recovery flow

Test matrix mirrors spec section 74: overlaps, boundaries, buffers, breaks, closures, notice limits, midnight boundaries, DST-safe zone math, multiple barbers, ANY-barber assignment, concurrent claims.

---

## 7. Directory Structure

```text
src/
├── app/
│   ├── (public)/            landing, book, services, barbers, appointment lookup
│   ├── (admin)/admin/       dashboard, calendar, appointments, customers, settings areas
│   ├── (auth)/sign-in/
│   └── api/                 webhooks, ics export, health
├── components/
│   ├── ui/                  design system primitives (button, sheet, field, ...)
│   ├── booking/             stepper, selectors, summary, confirmation
│   ├── public/              hero, sections, cards
│   └── admin/               tables, timeline, editors
├── lib/
│   ├── scheduling/          pure engine
│   ├── notifications/       NotificationService + providers
│   ├── auth/                better-auth config, guards
│   ├── tenant.ts            shop context resolution
│   ├── theme/               presets, token generation
│   └── utils/               cn, money, phone, haptics, sound
├── db/
│   ├── schema.ts
│   ├── index.ts
│   ├── repositories/        shop-scoped query functions
│   └── seed.ts
├── actions/                 server actions per domain
├── hooks/                   use-haptics, use-sound, use-media-query
└── config/                  constants, nav definitions
```

---

## 8. Delivery Phases

Each phase ends with: typecheck, lint, tests green, tracker updated.

### Phase 0: Repository and tooling foundation

Git init, pnpm Next.js 16 scaffold, TS strict, Tailwind v4, ESLint + Prettier, VS Code settings, `.env.example`, README, LICENSE, CONTRIBUTING, CODE OF CONDUCT, issue and PR templates, CI workflow (lint, typecheck, test, build), commit convention.

Done when: empty app deploys preview successfully and CI is green.

### Phase 1: Database and tenancy core

Docker Postgres for dev, Drizzle schema per section 5, migrations, seed script (demo shop, services, three barbers, schedules, sample appointments), `getShopContext()`, repository layer skeleton, Zod schemas for config shapes.

Done when: seed runs clean, context resolves shop from env, repositories compile with strict types.

### Phase 2: Authentication

Better Auth setup, Drizzle adapter, OWNER and BARBER roles, sign-in page (HIG styled), session helpers, middleware protection for `/admin`, first OWNER user via seed or bootstrap script.

Done when: unauthenticated `/admin` access redirects, signed-in owner lands on a placeholder dashboard shell.

### Phase 3: Design system and iOS HIG foundation

Token layer (light/dark), Geist font loading, base primitives: Button, IconButton, Card, InsetGroup, Field, Input, Textarea, Select, Switch, SegmentedControl, Badge, Avatar, Sheet (bottom on mobile, dialog on desktop), AlertDialog, Toast, Skeleton, EmptyState, Tabs, Tooltip, Popover. Motion primitives (springs, press scale, stagger), haptics and sound utilities with preference toggles, safe-area handling.

Done when: a living style page showcases every primitive in light and dark, keyboard and screen reader clean.

### Phase 4: Theme engine and presets

Preset definitions (Classic Barbershop, Midnight, Minimal, Copper, Emerald, Ocean, Editorial), CSS variable emission from shop.branding at request time, typography pairing support, radius and shadow scales, contrast validation helper.

Done when: changing the seeded shop's preset visibly restyles the whole public surface, no component hex values.

### Phase 5: Scheduling engine

Full `src/lib/scheduling` implementation plus exhaustive Vitest suite per section 6. Pure code, no UI.

Done when: every spec section 74 case passes, coverage on the package high, edge cases documented.

### Phase 6: Booking pipeline

Server actions: `getAvailability`, `createBooking` (transactional, AD-03), `cancelByCustomer`, `rescheduleByCustomer`, `lookupAppointment`. Rate limiting on public endpoints, conflict recovery result codes, lookup token issuance.

Done when: concurrent create test proves single winner; conflict path returns friendly structured error.

### Phase 7: Public customer experience

Landing page composed from shop.homepage sections, services page, barbers page, contact block, opening hours, booking flow (Service, Barber or Any, Date, Time, Details, Review, Confirmation) as a full-screen mobile sheet with progress header, appointment manage page (view, cancel, reschedule, add to calendar .ics download, call, directions), book again shortcut.

Done when: a guest can complete a real booking on a phone viewport end to end, all states styled (loading, empty, error, conflict recovery).

### Phase 8: Admin operations

Dashboard (today, next up, revenue estimate, warnings), calendar views (today, day timeline, week, list), appointment management (confirm, complete, cancel, no-show, reschedule, notes), customers list with history drawer.

Done when: owner can run a real day of bookings from the admin alone.

### Phase 9: Shop configuration admin

Services manager (CRUD, reorder, duration, buffer, price, image), barbers manager plus barber-service assignment, schedule editors (shop and barber level, multi-interval), break and closure managers, booking rules form, general settings, contact and location forms.

Done when: every value rendered publicly is editable here without code.

### Phase 10: Theme and homepage customization admin

Theme editor (preset picker plus custom color and font builder with live preview and contrast checks), homepage section editor (enable, reorder, edit content, pick images).

Done when: two shops with different presets and section orders render correctly from data alone.

### Phase 11: Notifications

NotificationService abstraction, in-app center with unread badge, deep links, mark read; Resend email provider with branded templates for booking, confirmation, cancellation, reschedule; admin notification triggers.

Done when: lifecycle events produce both in-app entries and emails in dev.

### Phase 12: PWA

Manifest with maskable icons, Serwist service worker, offline shell and messaging, install prompt guidance for Android, Apple touch icon and standalone meta for iOS, shortcuts (Book, My Appointment), theme color sync from shop branding.

Done when: Lighthouse PWA passes on Android Chrome, iOS standalone launch looks native, offline state never fakes success.

### Phase 13: SEO, AEO, GEO

Per-shop metadata generation, Open Graph and Twitter cards, canonical URLs, sitemap, robots, JSON-LD (LocalBusiness/HairSalon, Service, Person, BreadcrumbList, FAQPage where content exists), natural language answer content blocks.

Done when: rich results test validates schema and each shop page exposes complete business data.

### Phase 14: Hardening, testing, performance polish

Playwright suites: booking journey, reschedule, cancel, admin lifecycle, theme change, tenant guard regression. Accessibility audit pass (WCAG 2.2 AA targets), keyboard sweeps, reduced motion verification, bundle analysis, image optimization, Core Web Vitals tuning, security review against spec section 53 checklist.

Done when: CI green including E2E, Lighthouse performance and accessibility 95+ on public pages, acceptance criteria in spec section 94 all checked.

---

## 9. Testing Strategy

| Level        | Tool                   | Focus                                                          |
| ------------ | ---------------------- | -------------------------------------------------------------- |
| Unit         | Vitest                 | Scheduling engine, rules, money, tokens, timezone math         |
| Integration  | Vitest + test database | Repositories, booking transaction, exclusivity                 |
| E2E          | Playwright             | Five customer and admin journeys, cross-tenant guard           |
| Manual gates | Checklist              | iOS Safari, Android Chrome, desktop, reduced motion, dark mode |

---

## 10. Security Checklist (applies continuously)

- Server-side authorization on every mutation and private query
- Shop context derived server-side only
- Zod validation at every boundary
- Parameterized queries via Drizzle
- Secure httpOnly session cookies
- Rate limit public booking and lookup endpoints
- Lookup tokens hashed at rest
- No secrets in client bundles
- Admin routes excluded from indexing
- Dependency audit in CI

---

## 11. Risks and Mitigations

| Risk                                            | Mitigation                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Race condition double booking                   | Exclusion constraint plus transactional recheck (AD-03) with tested behavior     |
| Timezone bugs around midnight                   | Zone-aware library only, dedicated tests, no string date math                    |
| Serwist and Next 16 compatibility drift         | Verify early in Phase 12 spike, fallback to minimal custom SW                    |
| iOS Safari PWA limitations                      | Treat Android as full target, iOS gets graceful degradation and install guidance |
| Theme system leaking raw colors into components | Lint rule and review gate, tokens only                                           |
| Over-engineering                                | Phase gates, ship vertical slices, spec section 90 mindset                       |

---

## 12. Out of Scope for Now

Online payments, memberships, loyalty, coupons, inventory, payroll, accounting, product sales, marketplace, reviews platform, multi-location enterprise rollups, subscription billing, customer accounts, SMS and WhatsApp providers beyond the abstraction seam.

All are reachable later without structural changes per spec section 89.
