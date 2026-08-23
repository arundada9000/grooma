# Tracker

Single source of truth for build progress. Updated at the end of every work session.
Plan reference: `docs/IMPLEMENTATION_PLAN.md`

Project: Barber Appointment System
Started: 2026-08-23
Last updated: 2026-08-23 (planning complete)

---

## Current Status

|                   |                                            |
| ----------------- | ------------------------------------------ |
| Phase in progress | None, ready to start Phase 0               |
| Next up           | Phase 0: repository and tooling foundation |
| Blocking items    | None                                       |

---

## Phase Board

Status values: `not-started`, `in-progress`, `done`

| #   | Phase                                  | Status      | Notes                                                 |
| --- | -------------------------------------- | ----------- | ----------------------------------------------------- |
| 0   | Repository and tooling foundation      | not-started | Scaffold, strict TS, Tailwind v4, CI, repo docs       |
| 1   | Database and tenancy core              | not-started | Drizzle schema, seed, shop context, repositories      |
| 2   | Authentication                         | not-started | Better Auth, roles, admin route protection            |
| 3   | Design system and iOS HIG foundation   | not-started | Tokens, primitives, motion, haptics, sound            |
| 4   | Theme engine and presets               | not-started | Presets drive CSS variables from shop data            |
| 5   | Scheduling engine                      | not-started | Pure module plus exhaustive Vitest suite              |
| 6   | Booking pipeline                       | not-started | Transactional actions, conflict recovery, rate limits |
| 7   | Public customer experience             | not-started | Landing, services, barbers, booking flow, manage page |
| 8   | Admin operations                       | not-started | Dashboard, calendar, appointment actions, customers   |
| 9   | Shop configuration admin               | not-started | Services, barbers, schedules, breaks, closures, rules |
| 10  | Theme and homepage customization admin | not-started | Theme editor, homepage section editor                 |
| 11  | Notifications                          | not-started | In-app center, Resend email provider                  |
| 12  | PWA                                    | not-started | Manifest, Serwist, offline shell, iOS meta            |
| 13  | SEO, AEO, GEO                          | not-started | Metadata, JSON-LD, sitemap, robots                    |
| 14  | Hardening, testing, performance polish | not-started | E2E suites, a11y audit, CWV                           |

---

## Task Detail

### Phase 0: Repository and tooling foundation

- [ ] Git init with main branch and commit convention
- [ ] pnpm Next.js 16 + React 19 + TypeScript strict scaffold
- [ ] Tailwind CSS v4 wired through PostCSS or the Next plugin
- [ ] ESLint and Prettier configured and passing
- [ ] Editor settings and recommended extensions
- [ ] `.env.example` with documented variables
- [ ] README with setup instructions
- [ ] LICENSE, CONTRIBUTING, CODE OF CONDUCT
- [ ] Issue and pull request templates
- [ ] GitHub Actions CI: lint, typecheck, test, build
- [ ] Verify preview deployment works

### Phase 1: Database and tenancy core

- [ ] Local Postgres via Docker Compose
- [ ] Drizzle config and connection module
- [ ] Schema: shops, users, services, barbers, barber_services
- [ ] Schema: working_hours, breaks, closures, customers, appointments, notifications, email_log
- [ ] Appointments exclusion constraint for overlap prevention
- [ ] Indexes per plan section 5
- [ ] Seed script: demo shop, services, three barbers, schedules, sample appointments
- [ ] `getShopContext()` resolution from environment slug
- [ ] Shop-scoped repository layer skeleton
- [ ] Zod schemas for shop config JSONB shapes

### Phase 2: Authentication

- [ ] Better Auth with Drizzle adapter
- [ ] OWNER and BARBER roles on users
- [ ] Sign-in page matching design system
- [ ] Session helpers and server guards
- [ ] Middleware protecting `/admin`
- [ ] Bootstrap owner account path

### Phase 3: Design system and iOS HIG foundation

- [ ] Semantic token layer, light and dark
- [ ] Geist Sans and Mono loading
- [ ] Button, IconButton, Card, InsetGroup
- [ ] Form controls: Field, Input, Textarea, Select, Switch, SegmentedControl
- [ ] Overlays: Sheet (bottom mobile), AlertDialog, Toast, Popover, Tooltip
- [ ] Feedback: Badge, Avatar, Skeleton, EmptyState, Tabs
- [ ] Motion primitives: springs, press scale, stagger
- [ ] Haptics utility with preference gate
- [ ] Sound utility (WebAudio synth) with mute preference
- [ ] Safe area insets handling
- [ ] Style showcase page for review

### Phase 4: Theme engine and presets

- [ ] Preset definitions: Classic Barbershop, Midnight, Minimal, Copper, Emerald, Ocean, Editorial
- [ ] CSS variable emission from shop branding at request time
- [ ] Font pairing support from curated list
- [ ] Radius, shadow scales per theme
- [ ] Contrast validation helper
- [ ] Preset switching verified across public surface

### Phase 5: Scheduling engine

- [ ] types.ts, interval.ts math
- [ ] hours.ts expansion with zone awareness
- [ ] slots.ts generation with duration and buffer filtering
- [ ] rules.ts notice and deadline checks
- [ ] availability.ts composition API
- [ ] Vitest matrix covering spec section 74 cases
- [ ] Midnight boundary and DST-safe tests

### Phase 6: Booking pipeline

- [ ] getAvailability server action
- [ ] createBooking transaction with recheck and constraint mapping
- [ ] cancelByCustomer, rescheduleByCustomer with deadline checks
- [ ] lookupAppointment with hashed token
- [ ] Rate limiting on public endpoints
- [ ] Conflict result codes driving recovery UX
- [ ] Concurrency test proving single winner

### Phase 7: Public customer experience

- [ ] Homepage sections rendered from shop.homepage
- [ ] Services page, Barbers page
- [ ] Contact, opening hours, location blocks
- [ ] Booking flow: service, barber or any, date, time, details, review, confirmation
- [ ] Full-screen mobile booking sheet with progress header
- [ ] Appointment manage page via secure link
- [ ] Cancel and reschedule flows with deadline messaging
- [ ] Add to calendar (.ics) download
- [ ] Book again shortcut
- [ ] Loading, empty, error, offline states styled

### Phase 8: Admin operations

- [ ] Dashboard: today list, next up, revenue estimate, warnings
- [ ] Calendar: today, day timeline, week, list views
- [ ] Appointment actions: confirm, complete, cancel, no-show, reschedule, notes
- [ ] Customers list with history drawer
- [ ] Mobile-friendly admin navigation

### Phase 9: Shop configuration admin

- [ ] Services manager CRUD with reorder
- [ ] Barbers manager with service assignment
- [ ] Schedule editor, shop and barber level, multi-interval
- [ ] Breaks manager: recurring and one-off
- [ ] Closures manager: full day and partial
- [ ] Booking rules form
- [ ] General, contact, location settings forms

### Phase 10: Theme and homepage customization admin

- [ ] Preset picker with live preview
- [ ] Custom theme builder: colors, fonts, radius, style
- [ ] Contrast validation in builder
- [ ] Homepage section editor: enable, reorder, content, images

### Phase 11: Notifications

- [ ] NotificationService abstraction with provider registry
- [ ] In-app notification center, unread badge, deep links, mark read
- [ ] Resend email provider with branded templates
- [ ] Lifecycle triggers: booked, confirmed, cancelled, rescheduled
- [ ] Admin notifications on new booking and cancellations

### Phase 12: PWA

- [ ] Web manifest with maskable icons and shortcuts
- [ ] Serwist service worker and offline shell
- [ ] Offline messaging that never fakes booking success
- [ ] Android install prompt guidance
- [ ] iOS Apple touch icon, standalone meta, safe areas
- [ ] Theme color synced from shop branding

### Phase 13: SEO, AEO, GEO

- [ ] Per-shop metadata generation
- [ ] Open Graph and Twitter cards
- [ ] Canonical URLs, sitemap.ts, robots.ts
- [ ] JSON-LD: HairSalon or LocalBusiness, Service, Person, BreadcrumbList, FAQPage
- [ ] FAQ answer content support

### Phase 14: Hardening, testing, performance polish

- [ ] Playwright: booking journey, reschedule, cancel, admin lifecycle, theme change, tenant guard
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

---

## Changelog

### 2026-08-23

- Read and analyzed `initial-idea.md` full spec and developer profile
- Created `docs/IMPLEMENTATION_PLAN.md`
- Created this tracker
- Scope adjusted to single live shop with tenant-aware core per owner request
