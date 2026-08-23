# Tracker

Single source of truth for build progress. Updated at the end of every work session.
Plan reference: `docs/IMPLEMENTATION_PLAN.md`

Project: Grooma (barber appointment system)
Started: 2026-08-23
Last updated: 2026-08-23 (phase 2 complete)

---

## Current Status

|                   |                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Phase in progress | None                                                                                      |
| Next up           | Phase 3: design system and iOS HIG foundation                                             |
| Blocking items    | Preview deployment check waits until the repo is pushed to GitHub and connected to Vercel |

---

## Phase Board

Status values: `not-started`, `in-progress`, `done`

| #   | Phase                                  | Status      | Notes                                                                   |
| --- | -------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| 0   | Repository and tooling foundation      | done        | CI runs on push once GitHub remote is added                             |
| 1   | Database and tenancy core              | done        | Local Postgres 16 on this machine; compose file kept as portable option |
| 2   | Authentication                         | done        | Better Auth 1.7, proxy.ts guard, owner bootstrap via seed                |
| 3   | Design system and iOS HIG foundation   | not-started | Tokens, primitives, motion, haptics, sound                              |
| 4   | Theme engine and presets               | not-started | Presets drive CSS variables from shop data                              |
| 5   | Internationalization foundation        | not-started | en and ne locales, typed dictionaries, language toggle                  |
| 6   | Scheduling engine                      | not-started | Pure module plus exhaustive Vitest suite                                |
| 7   | Booking pipeline                       | not-started | Transactional actions, conflict recovery, rate limits                   |
| 8   | Public customer experience             | not-started | Landing, services, barbers, booking flow, manage page                   |
| 9   | Admin operations                       | not-started | Dashboard, calendar, appointment actions, customers                     |
| 10  | Shop configuration admin               | not-started | Services, barbers, schedules, breaks, closures, rules                   |
| 11  | Theme and homepage customization admin | not-started | Theme editor, homepage section editor                                   |
| 12  | Notifications                          | not-started | In-app center, Resend email provider                                    |
| 13  | PWA                                    | not-started | Manifest, Serwist, offline shell, iOS meta                              |
| 14  | SEO, AEO, GEO                          | not-started | Metadata, JSON-LD, hreflang, sitemap, robots                            |
| 15  | Hardening, testing, performance polish | not-started | E2E suites, a11y audit, CWV                                             |

---

## Task Detail

### Phase 0: Repository and tooling foundation

- [x] Git init with main branch and commit convention
- [x] pnpm Next.js 16 + React 19 + TypeScript strict scaffold
- [x] Tailwind CSS v4 wired through PostCSS or the Next plugin
- [x] ESLint and Prettier configured and passing
- [x] Editor settings and recommended extensions
- [x] `.env.example` with documented variables
- [x] README with setup instructions
- [x] LICENSE, CONTRIBUTING, CODE OF CONDUCT
- [x] Issue and pull request templates
- [x] GitHub Actions CI: lint, typecheck, test, build
- [ ] Verify preview deployment works

### Phase 1: Database and tenancy core

- [x] Local Postgres provisioning (docker compose provided; this machine runs an existing Postgres 16, database `grooma` created)
- [x] Drizzle config and connection module
- [x] Schema: shops, users, services, barbers, barber_services
- [x] Schema: working_hours, breaks, closures, customers, appointments, notifications, email_log
- [x] Appointments exclusion constraint for overlap prevention (custom migration, verified 23P01 on overlap)
- [x] Indexes per plan section 5
- [x] Seed script: demo shop, five services, three barbers, schedules, recurring break, future closure, four sample appointments
- [x] `getShopContext()` resolution from environment slug
- [x] Shop-scoped repository layer skeleton
- [x] Zod schemas for shop config JSONB shapes including LocalizedText

### Phase 2: Authentication

- [x] Better Auth with Drizzle adapter (usePlural against users, accounts, sessions, verifications)
- [x] OWNER and BARBER roles on users
- [x] Sign-in page matching design system (interim HIG-flavored styling until Phase 3)
- [x] Session helpers and server guards (getSession, requireUser, requireOwner)
- [x] Middleware protecting `/admin` (Next 16 proxy.ts, cookie presence at edge, real authz server-side)
- [x] Bootstrap owner account path (seed calls auth.api.signUpEmail then promotes role and shopId)

### Phase 3: Design system and iOS HIG foundation

- [ ] Semantic token layer, light and dark
- [ ] Geist Sans and Mono loading plus Devanagari companion face for Nepali
- [ ] Button, IconButton, Card, InsetGroup
- [ ] Form controls: Field, Input, Textarea, Select, Switch, SegmentedControl
- [ ] Overlays: Sheet (bottom mobile), AlertDialog, Toast, Popover, Tooltip
- [ ] Feedback: Badge, Avatar, Skeleton, EmptyState, Tabs
- [ ] Motion primitives: springs, press scale, stagger
- [ ] Haptics utility with preference gate
- [ ] Sound utility (WebAudio synth) with mute preference
- [ ] Safe area insets handling
- [ ] Style showcase page for review including Devanagari samples

### Phase 4: Theme engine and presets

- [ ] Preset definitions: Classic Barbershop, Midnight, Minimal, Copper, Emerald, Ocean, Editorial
- [ ] CSS variable emission from shop branding at request time
- [ ] Font pairing support from curated list
- [ ] Radius, shadow scales per theme
- [ ] Contrast validation helper
- [ ] Preset switching verified across public surface

### Phase 5: Internationalization foundation

- [ ] Locale types and supported locale list (`en` default, `ne`)
- [ ] Typed dictionaries: `src/i18n/dictionaries/en.ts` base and `ne.ts`
- [ ] Compile-time key checking against en base, fallback chain ne to en
- [ ] Middleware locale negotiation: cookie, Accept-Language, default
- [ ] `[locale]` route segment structure with root redirects
- [ ] Server helper for dictionary access in Server Components
- [ ] Client provider for dictionary access in Client Components
- [ ] Language switcher preserving current path, persisted via cookie
- [ ] Localized date, time, number, currency formatting helpers
- [ ] hreflang alternates metadata helper
- [ ] Verify both locales render Devanagari typography correctly

### Phase 6: Scheduling engine

- [ ] types.ts, interval.ts math
- [ ] hours.ts expansion with zone awareness
- [ ] slots.ts generation with duration and buffer filtering
- [ ] rules.ts notice and deadline checks
- [ ] availability.ts composition API
- [ ] Vitest matrix covering spec section 74 cases
- [ ] Midnight boundary and DST-safe tests

### Phase 7: Booking pipeline

- [ ] getAvailability server action
- [ ] createBooking transaction with recheck and constraint mapping
- [ ] cancelByCustomer, rescheduleByCustomer with deadline checks
- [ ] lookupAppointment with hashed token
- [ ] Rate limiting on public endpoints
- [ ] Conflict result codes driving recovery UX
- [ ] Concurrency test proving single winner

### Phase 8: Public customer experience

- [ ] Homepage sections rendered from shop.homepage
- [ ] Services page, Barbers page
- [ ] Contact, opening hours, location blocks
- [ ] Booking flow: service, barber or any, date, time, details, review, confirmation
- [ ] Full-screen mobile booking sheet with progress header
- [ ] Appointment manage page via secure link
- [ ] Cancel and reschedule flows with deadline messaging
- [ ] Add to calendar (.ics) download
- [ ] Book again shortcut
- [ ] Every customer-facing string flows through dictionaries, en and ne verified
- [ ] Loading, empty, error, offline states styled

### Phase 9: Admin operations

- [ ] Dashboard: today list, next up, revenue estimate, warnings
- [ ] Calendar: today, day timeline, week, list views
- [ ] Appointment actions: confirm, complete, cancel, no-show, reschedule, notes
- [ ] Customers list with history drawer
- [ ] Mobile-friendly admin navigation
- [ ] Admin strings routed through dictionaries, English first

### Phase 10: Shop configuration admin

- [ ] Services manager CRUD with reorder
- [ ] Barbers manager with service assignment
- [ ] Schedule editor, shop and barber level, multi-interval
- [ ] Breaks manager: recurring and one-off
- [ ] Closures manager: full day and partial
- [ ] Booking rules form
- [ ] General, contact, location settings forms
- [ ] LocalizedText editing support (en required, ne optional)

### Phase 11: Theme and homepage customization admin

- [ ] Preset picker with live preview
- [ ] Custom theme builder: colors, fonts, radius, style
- [ ] Contrast validation in builder
- [ ] Homepage section editor: enable, reorder, content, images
- [ ] Per-locale homepage section content

### Phase 12: Notifications

- [ ] NotificationService abstraction with provider registry
- [ ] In-app notification center, unread badge, deep links, mark read
- [ ] Resend email provider with branded templates
- [ ] Lifecycle triggers: booked, confirmed, cancelled, rescheduled
- [ ] Admin notifications on new booking and cancellations
- [ ] Template locale resolution per recipient, shop default as fallback

### Phase 13: PWA

- [ ] Web manifest with maskable icons and shortcuts
- [ ] Serwist service worker and offline shell
- [ ] Offline messaging that never fakes booking success
- [ ] Android install prompt guidance
- [ ] iOS Apple touch icon, standalone meta, safe areas
- [ ] Theme color synced from shop branding

### Phase 14: SEO, AEO, GEO

- [ ] Per-shop metadata generation
- [ ] Open Graph and Twitter cards
- [ ] Canonical URLs, sitemap.ts covering both locales, robots.ts
- [ ] hreflang alternates for en and ne
- [ ] JSON-LD: HairSalon or LocalBusiness, Service, Person, BreadcrumbList, FAQPage
- [ ] FAQ answer content support in both languages

### Phase 15: Hardening, testing, performance polish

- [ ] Playwright: booking journey, reschedule, cancel, admin lifecycle, theme change, language switch, tenant guard
- [ ] Accessibility audit to WCAG 2.2 AA targets
- [ ] Keyboard sweep and focus management pass
- [ ] Reduced motion verification
- [ ] Bundle analysis and code splitting pass
- [ ] Image optimization pass
- [ ] Core Web Vitals tuning
- [ ] Security checklist review against plan section 10
- [ ] Spec section 94 acceptance criteria all verified

---

## Decision Log

| #     | Decision                                                                              | Rationale                                                                                                          | Date       |
| ----- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------- |
| AD-01 | Single shop runtime now, tenant-aware schema and data access from day one             | Owner request. Two upgrade paths preserved: separate deployment per shop, or slug based multi-tenant routing later | 2026-08-23 |
| AD-02 | Availability computed on demand, no slot storage                                      | Flexibility, spec section 25                                                                                       | 2026-08-23 |
| AD-03 | Postgres exclusion constraint plus transactional recheck for bookings                 | Database level guarantee against race conditions                                                                   | 2026-08-23 |
| AD-04 | timestamptz UTC storage, wall-clock schedules interpreted in shop timezone            | Correctness across zones                                                                                           | 2026-08-23 |
| AD-05 | Snapshot fields on appointments                                                       | History must never change when services change                                                                     | 2026-08-23 |
| AD-06 | Guest-first booking with hashed lookup tokens                                         | No forced accounts, secure access                                                                                  | 2026-08-23 |
| AD-07 | iOS HIG interaction contract codified in design system                                | Owner priority. Consistency enforced at component level                                                            | 2026-08-23 |
| AD-08 | Server boundary contract: validate, resolve tenant, authenticate, authorize, transact | Security by structure, spec sections 53 and 78                                                                     | 2026-08-23 |
| AD-09 | Route locales with typed custom dictionaries for en and ne                            | Owner request. Crawlable localized URLs, compile-time key safety, no heavy dependency for two locales              | 2026-08-23 |
| AD-10 | Better Auth owns identity tables; users.id is text, credentials live in accounts      | Matches library model exactly, avoids drift. Domain fields shopId and role injected via databaseHooks at create     | 2026-08-23 |
| AD-11 | Edge proxy checks cookie presence only, real authorization server-side                | proxy.ts cannot query the database. requireUser/requireOwner enforce session and role on every admin page          | 2026-08-23 |

---

## Changelog

### 2026-08-23 (session 5)

- Phase 2 complete:
  - Installed better-auth 1.7.1; studied installed types plus Next 16 bundled docs (middleware convention renamed to proxy.ts)
  - Schema: users converted to Better Auth model (text id, emailVerified, image, global unique email), added accounts (issuer, provider credentials), sessions, verifications tables; barbers.userId and notifications.userId became text FKs
  - Regenerated migration baseline from scratch on a fresh database (dev data disposable); re-added the double-booking exclusion constraint as custom migration
  - auth instance with drizzleAdapter usePlural, emailAndPassword, session cookieCache (5 min), nextCookies plugin
  - databaseHooks.user.create.before injects shopId (resolved from DEFAULT_SHOP_SLUG) and default BARBER role at sign-up time
  - Session helpers getSession, requireUser, requireOwner in src/lib/auth/session.ts behind server-only
  - Route handler at /api/auth/[...all] via toNextJsHandler; src/proxy.ts guards /admin/:path* by cookie presence and forwards ?next
  - Sign-in page and client form via better-auth/react, interim HIG-flavored styling; admin shell shows session info and today's appointment count scoped by shopId
  - Seed bootstraps owner through auth.api.signUpEmail then promotes role OWNER, sets shopId, verifies email; wipes accounts, sessions, verifications before users
  - Verified live on dev server: ok endpoint 200, wrong password 401, unauthenticated /admin 307 to sign-in, signed-in owner sees dashboard, sign-out clears session
  - All checks green: format, lint, typecheck, 11 tests passing, production build registers Proxy
- Environment note: C: drive hit 0 bytes free and broke Postgres writes (could not write init file). Cleared npm cache (30.5 GB), pip cache, old temp files to restore 30 GB

### 2026-08-23 (session 4)

- Phase 1 complete:
  - Added drizzle-orm, postgres driver, zod, server-only, drizzle-kit, tsx, dotenv
  - Docker Compose for Postgres provided; this machine has no Docker so dev uses the existing local Postgres 16 (database grooma created)
  - Full schema: shops, users, services, barbers, barber_services, working_hours, breaks, closures, customers, appointments, notifications, email_log with enums, indexes and FKs
  - Custom migration adds btree_gist extension and the appointments_no_double_booking exclusion constraint
  - Verified constraint live: overlapping insert rejected with 23P01 exclusion_violation
  - Seed: Demo Classic Barbershop with bilingual service names, three barbers, Sun to Fri hours plus Hari late start, daily lunch break, future closure, four sample appointments across statuses
  - getShopContext() request-cached resolver and shops repository
  - Zod schemas for contact, location, social, branding, homepage sections, booking rules; LocalizedText type with en fallback plus tests
  - Fixed ESM import hoisting pitfall with dedicated src/db/env.ts loader for scripts
  - README setup section now reflects the real Phase 1 workflow
  - All checks green: format, lint, typecheck, 11 tests passing, production build

### 2026-08-23 (session 3)

- Product named Grooma with tagline "Your grooming, made simple." applied to package metadata, README, and app metadata
- Planned internationalization: en and ne locales, added AD-09, inserted Phase 5, renumbered phases 5 through 14 to 6 through 15
- Added LocalizedText jsonb pattern to data model for shop-authored content
- Strengthened pnpm-only policy in README and CONTRIBUTING
- Removed unused template SVG assets and replaced boilerplate home page with interim Grooma placeholder
- Tightened .gitignore: agent/editor local dirs, log files, tool caches
- Verified lint, typecheck, tests, production build after changes

### 2026-08-23 (session 2)

- Read and analyzed `docs/initial-idea.md` full spec and developer profile
- Created `docs/IMPLEMENTATION_PLAN.md` and this tracker
- Scope adjusted to single live shop with tenant-aware core per owner request
- Phase 0 complete:
  - Scaffolded Next.js 16.3.2 with React 19, TypeScript strict, Tailwind v4, src dir, app router
  - Added clsx and tailwind-merge behind a tested `cn()` utility
  - Configured Prettier with Tailwind class sorting, integrated with ESLint
  - Added Vitest (config as .mts to load as ESM) with cn unit tests
  - Added README, proprietary LICENSE, CONTRIBUTING, CODE OF CONDUCT
  - Added GitHub issue forms, PR template, and CI workflow (lint, format check, typecheck, test, build)
  - Added .gitattributes enforcing LF, renamed default branch to main
  - Moved spec doc to docs/initial-idea.md and updated plan reference
  - Verified: lint, typecheck, tests (4 passing), production build all green
