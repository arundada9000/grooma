# Tracker

Single source of truth for build progress. Updated at the end of every work session.
Plan reference: `docs/IMPLEMENTATION_PLAN.md`

Project: Grooma (barber appointment system)
Started: 2026-08-23
Last updated: 2026-08-24 (phase 12 complete: notifications)

---

## Current Status

|                   |                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Phase in progress | None                                                                                      |
| Next up           | Phase 12 notifications                                                                    |
| Blocking items    | Preview deployment check waits until the repo is pushed to GitHub and connected to Vercel |

---

## Phase Board

Status values: `not-started`, `in-progress`, `done`

| #   | Phase                                  | Status      | Notes                                                                     |
| --- | -------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| 0   | Repository and tooling foundation      | done        | CI runs on push once GitHub remote is added                               |
| 1   | Database and tenancy core              | done        | Local Postgres 16 on this machine; compose file kept as portable option   |
| 2   | Authentication                         | done        | Better Auth 1.7, proxy.ts guard, owner bootstrap via seed                 |
| 3   | Design system and iOS HIG foundation   | done        | Tokens, primitives, motion, haptics, sound; showcase at /style            |
| 4   | Theme engine and presets               | done        | Presets drive CSS variables from shop data                                |
| 5   | Internationalization foundation        | done        | en and ne locales, typed dictionaries, language toggle                    |
| 6   | Scheduling engine                      | done        | Pure module, 48 tests over the spec 74 matrix; zone safe via @date-fns/tz |
| 7   | Booking pipeline                       | done        | Transactional core, exclusion constraint arbiter, race test green         |
| 8   | Public customer experience             | done        | Home, services, barbers, booking wizard, manage page, ICS route           |
| 9   | Admin operations                       | done        | Dashboard, calendar, appointment actions, customers                       |
| 10  | Shop configuration admin               | done        | Services, barbers, schedules, breaks, closures, rules                     |
| 11  | Theme and homepage customization admin | done        | Theme editor, homepage section editor                                     |
| 12  | Notifications                          | done        | Provider-independent service, inbox, Resend templates                     |
| 13  | PWA                                    | not-started | Manifest, Serwist, offline shell, iOS meta                                |
| 14  | SEO, AEO, GEO                          | not-started | Metadata, JSON-LD, hreflang, sitemap, robots                              |
| 15  | Hardening, testing, performance polish | not-started | E2E suites, a11y audit, CWV                                               |

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

- [x] Semantic token layer, light and dark
- [x] Geist Sans and Mono loading plus Devanagari companion face for Nepali (Noto Sans Devanagari)
- [x] Button, IconButton, Card, InsetGroup
- [x] Form controls: Field, Input, Textarea, Select, Switch, SegmentedControl
- [x] Overlays: Sheet (bottom mobile, dialog desktop), AlertDialog, Toast, Popover, Tooltip
- [x] Feedback: Badge, Avatar, Skeleton, EmptyState, Tabs
- [x] Motion primitives: springs, press scale, stagger
- [x] Haptics utility with preference gate (Vibration API, on by default)
- [x] Sound utility (WebAudio synth) with mute preference (off by default)
- [x] Safe area insets handling (pt-safe, pb-safe, pl-safe, pr-safe utilities)
- [x] Style showcase page for review including Devanagari samples (/style)

### Phase 4: Theme engine and presets

- [x] Preset definitions: Classic Barbershop, Midnight, Minimal, Copper, Emerald, Ocean, Editorial
- [x] CSS variable emission from shop branding at request time
- [x] Font pairing support from curated list
- [x] Radius, shadow scales per theme
- [x] Contrast validation helper
- [x] Preset switching verified across public surface

### Phase 5: Internationalization foundation

- [x] Locale types and supported locale list (`en` default, `ne`)
- [x] Typed dictionaries: `src/i18n/dictionaries/en.ts` base and `ne.ts`
- [x] Compile-time key checking against en base, fallback chain ne to en
- [x] Middleware locale negotiation: cookie, Accept-Language, default
- [x] `[locale]` route segment structure with root redirects
- [x] Server helper for dictionary access in Server Components
- [x] Client provider for dictionary access in Client Components
- [x] Language switcher preserving current path, persisted via cookie
- [x] Localized date, time, number, currency formatting helpers
- [x] hreflang alternates metadata helper
- [x] Verify both locales render Devanagari typography correctly

### Phase 6: Scheduling engine

- [x] types.ts, interval.ts math
- [x] hours.ts expansion with zone awareness
- [x] slots.ts generation with duration and buffer filtering
- [x] rules.ts notice and deadline checks
- [x] availability.ts composition API
- [x] Vitest matrix covering spec section 74 cases
- [x] Midnight boundary and DST-safe tests

### Phase 7: Booking pipeline

- [x] getAvailability server action
- [x] createBooking transaction with recheck and constraint mapping
- [x] cancelByCustomer, rescheduleByCustomer with deadline checks
- [x] lookupAppointment with hashed token
- [x] Rate limiting on public endpoints
- [x] Conflict result codes driving recovery UX
- [x] Concurrency test proving single winner

### Phase 8: Public customer experience

- [x] Homepage sections rendered from shop.homepage
- [x] Services page, Barbers page
- [x] Contact, opening hours, location blocks
- [x] Booking flow: service, barber or any, date, time, details, review, confirmation
- [x] Full-screen mobile booking sheet with progress header
- [x] Appointment manage page via secure link
- [x] Cancel and reschedule flows with deadline messaging
- [x] Add to calendar (.ics) download
- [x] Book again shortcut
- [x] Every customer-facing string flows through dictionaries, en and ne verified
- [ ] Loading, empty, error, offline states styled

### Phase 9: Admin operations

- [x] Dashboard: today list, next up, revenue estimate, warnings
- [x] Calendar: today, day timeline, week, list views
- [x] Appointment actions: confirm, complete, cancel, no-show, reschedule, notes
- [x] Customers list with history drawer
- [x] Mobile-friendly admin navigation
- [x] Admin strings routed through dictionaries, English first

### Phase 10: Shop configuration admin

- [x] Services manager CRUD with reorder
- [x] Barbers manager with service assignment
- [x] Schedule editor, shop and barber level, multi-interval
- [x] Breaks manager: recurring and one-off
- [x] Closures manager: full day and partial
- [x] Booking rules form
- [x] General, contact, location settings forms
- [x] LocalizedText editing support (en required, ne optional)

### Phase 11: Theme and homepage customization admin

- [x] Preset picker with live preview
- [x] Custom theme builder: colors, fonts, radius, style
- [x] Contrast validation in builder
- [x] Homepage section editor: enable, reorder, content, images (content model shipped; gallery/hero/about images editable)
- [x] Per-locale homepage section content

### Phase 12: Notifications

- [x] NotificationService abstraction with provider registry
- [x] In-app notification center, unread badge, deep links, mark read
- [x] Resend email provider with branded templates
- [x] Lifecycle triggers: booked, confirmed, cancelled, rescheduled
- [x] Admin notifications on new booking and cancellations
- [x] Template locale resolution per recipient, shop default as fallback

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

| #     | Decision                                                                                                                                                      | Rationale                                                                                                                                                                                                                                                                                                       | Date       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| AD-01 | Single shop runtime now, tenant-aware schema and data access from day one                                                                                     | Owner request. Two upgrade paths preserved: separate deployment per shop, or slug based multi-tenant routing later                                                                                                                                                                                              | 2026-08-23 |
| AD-02 | Availability computed on demand, no slot storage                                                                                                              | Flexibility, spec section 25                                                                                                                                                                                                                                                                                    | 2026-08-23 |
| AD-03 | Postgres exclusion constraint plus transactional recheck for bookings                                                                                         | Database level guarantee against race conditions                                                                                                                                                                                                                                                                | 2026-08-23 |
| AD-04 | timestamptz UTC storage, wall-clock schedules interpreted in shop timezone                                                                                    | Correctness across zones                                                                                                                                                                                                                                                                                        | 2026-08-23 |
| AD-05 | Snapshot fields on appointments                                                                                                                               | History must never change when services change                                                                                                                                                                                                                                                                  | 2026-08-23 |
| AD-06 | Guest-first booking with hashed lookup tokens                                                                                                                 | No forced accounts, secure access                                                                                                                                                                                                                                                                               | 2026-08-23 |
| AD-07 | iOS HIG interaction contract codified in design system                                                                                                        | Owner priority. Consistency enforced at component level                                                                                                                                                                                                                                                         | 2026-08-23 |
| AD-08 | Server boundary contract: validate, resolve tenant, authenticate, authorize, transact                                                                         | Security by structure, spec sections 53 and 78                                                                                                                                                                                                                                                                  | 2026-08-23 |
| AD-09 | Route locales with typed custom dictionaries for en and ne                                                                                                    | Owner request. Crawlable localized URLs, compile-time key safety, no heavy dependency for two locales                                                                                                                                                                                                           | 2026-08-23 |
| AD-10 | Better Auth owns identity tables; users.id is text, credentials live in accounts                                                                              | Matches library model exactly, avoids drift. Domain fields shopId and role injected via databaseHooks at create                                                                                                                                                                                                 | 2026-08-23 |
| AD-11 | Edge proxy checks cookie presence only, real authorization server-side                                                                                        | proxy.ts cannot query the database. requireUser/requireOwner enforce session and role on every admin page                                                                                                                                                                                                       | 2026-08-23 |
| AD-12 | Themes emit as inline CSS custom properties on html, consumed through semantic tokens                                                                         | Inline beats stylesheet defaults with no cascade ordering games; unknown preset ids fall back to Classic Barbershop. connection() in the root layout keeps every route request-time so preset changes appear without rebuilds                                                                                   | 2026-08-23 |
| AD-13 | Locale prefix routing via [locale] root segment; negotiation in proxy: cookie, Accept-Language, default                                                       | Crawlable localized URLs per AD-09. next/root-params exposes the locale to any Server Component without prop drilling. Auth redirects and admin gates stay locale aware                                                                                                                                         | 2026-08-23 |
| AD-14 | Slot grid spans raw working hours; blocked minutes render disabled with reasons instead of vanishing                                                          | A greyed chip with BREAK/CLOSURE/BOOKED beats an unexplained hole. Footprint = duration + buffer must fit one contiguous free window; barber hours replace shop hours for that weekday; ranges are half open [start, end)                                                                                       | 2026-08-24 |
| AD-15 | Public endpoints rate limited in process per IP plus action                                                                                                   | Single Node instance now; the limiter is one function, swap its store for Redis when deployment fans out. Limits: availability 60/min, create 5/min, manage 20/min                                                                                                                                              | 2026-08-24 |
| AD-16 | Booking races decided by the exclusion constraint, app maps Postgres 23P01 to SLOT_UNAVAILABLE                                                                | The transactional recheck narrows the window but cannot close it under READ COMMITTED; drizzle wraps driver errors so the cause chain is walked for the code                                                                                                                                                    | 2026-08-24 |
| AD-17 | Public chrome lives in the (public) route group under [locale]; admin and sign-in keep their own layout                                                       | SiteHeader/SiteFooter render once for every customer page while /admin and /signIn stay uncluttered; homepage sections map 1:1 to shop.homepage entries so enabling a section needs zero code                                                                                                                   | 2026-08-24 |
| AD-18 | Booking wizard keeps availability client side per seven day chunk keyed by selection signature                                                                | Schema caps dateKeys at seven per call; cache misses on service/barber/refresh change replace cache clearing effects (no sync setState); slot chips derive HH:MM from engine startMinute, never from epoch arithmetic                                                                                           | 2026-08-24 |
| AD-19 | Race test pins one barber instead of ANY                                                                                                                      | Two ANY racers can legitimately each win a different chair once one transaction's busy read lands after the other's commit; the exclusion constraint only arbitrates colliding ranges on the same barber                                                                                                        | 2026-08-24 |
| AD-20 | Staff reschedule skips customer notice rules on purpose; staff status changes follow a TRANSITIONS map                                                        | Owners move appointments freely (capacity probe plus exclusion constraint still arbitrate) while confirm/complete/noShow/cancel only apply from their legal source statuses, returning STATE_CONFLICT otherwise                                                                                                 | 2026-08-24 |
| AD-21 | Homepage content is a discriminated union of strict per-type Zod records; unknown keys stripped, caps enforced, blank localized fields collapse away on input | Storage stays forward compatible (older rows parse, new types default to empty content), the renderer can switch exhaustively per type, and editor drafts round trip through a laxer input schema whose output always satisfies the storage contract (unit tested)                                              | 2026-08-24 |
| AD-22 | Notification dispatch never throws; admin in-app rows only for booked/cancelled/rescheduled while every kind emails the customer when an address exists       | Booking mutations must not fail because a notification did; spec section 37 lists new/cancel/reschedule as owner-relevant and confirmations as customer-only. Console provider in dev, fetch-based Resend behind RESEND_API_KEY. MutationMeta mirrors AppointmentEventData so action call sites spread directly | 2026-08-24 |

---

## Changelog

### 2026-08-24 (session 19b)

- Fixed runtime crash when opening an inbox row: next/root-params locale() is route-context only and throws inside Server Actions. The notifications actions now take the locale through a hidden form field (validated with isLocale, DEFAULT_LOCALE fallback) instead of getLocale(); both inbox forms carry it
- Verified live end-to-end without client JS: seeded an ADMIN notification row directly, POSTed the rendered $ACTION_ID form to openNotificationAction (303 back to the inbox, row marked read), then POSTed the real booking row and got 303 deep-linking to its appointment detail; smoke row removed afterwards
- Live trigger proof for free: a real wizard booking made by the owner during testing had already fanned out APPOINTMENT_BOOKED to the demo owner with correct payload interpolation ("{name} booked {service}") — the full public path works in dev
- All checks green: format, lint, typecheck

### 2026-08-24 (session 19)

- Phase 12 notifications complete:
  - src/lib/notifications: types.ts (AppointmentEventData, EmailMessage, EmailProvider contract), providers.ts (console provider logging info in dev; fetch-based Resend provider when RESEND_API_KEY set, throws on non-ok; channel resolved from env at call time with EMAIL_FROM default "Grooma <bookings@localhost>"), templates.ts (pure renderAppointmentEmail producing branded inline-styled HTML plus plain text, subject/intro/body rows through the dictionary email block, html escaping), service.ts (dispatchAppointmentEvent: admin fan-out to all shop owners for BOOKED/CANCELLED/RESCHEDULED via createAdminNotifications, email leg queued as QUEUED then finalized SENT/FAILED whenever customerEmail exists, never throws at call sites)
  - Triggers wired into both pipelines: booking/actions.ts fires BOOKED/CANCELLED/RESCHEDULED with CUSTOMER actor after successful cores; admin/actions.ts fires CONFIRMED/CANCELLED/RESCHEDULED with STAFF actor, staff reschedule overrides snapshot startMs/endMs with the new range. MutationMeta added to booking results (service/barber names, startMs/endMs, priceCents, customer name/email) mirroring AppointmentEventData so call sites spread directly; findAppointmentByTokenHash now joins customers to feed it
  - Admin inbox at /admin/notifications: server page listing latest 50 rows with type icon keys, payload-derived labels, unread dot, per-row forms marking read then deep-linking to the appointment detail; mark-all-read button when unread > 0; empty state. AdminNav items gained a badge slot (desktop count pill, mobile dot) fed by countUnreadNotifications in the admin layout; new Inbox tab between Customers and Settings
  - Dictionaries en and ne: admin.nav.notifications, admin.notifications block ({name}/{service}/{via} interpolation, byStaff suffix), top-level email block (subjects and bodies for all four kinds)
  - Tests: templates unit suite (rendering, interpolation, staff suffix, html-only escaping), providers unit suite (channel resolution matrix), integration suite against local Postgres proving real fan-out (owner row + SENT console-provider log for BOOKED, CONFIRMED skipping admin rows but logging email, null email adding zero log rows, read-state transitions including idempotent second mark, dispatch resolving undefined); barbers.name notNull caught by the suite along the way
- Verified live: signed-in owner gets 200 on /en/admin/notifications and /ne/admin/notifications with localized Inbox label and empty state; anonymous redirects 307 to the localized sign-in preserving next
- All checks green: format, lint, typecheck, 120 tests

### 2026-08-24 (session 18)

- Phase 11 complete: homepage section content model and per-locale editing:
  - shop-config.ts: homepageConfigSchema rewritten as a discriminated union over the thirteen section types; each type gets a strict content record (localized text requires en, repeater caps gallery 12 / why-us 6 / testimonials 9 / faq 10), unknown content keys strip instead of rejecting older rows, missing content defaults to {}
  - admin.ts: homepageConfigInputSchema mirrors every type for editor payloads; blank localized pairs collapse to undefined, empty repeater rows drop (all-empty lists become undefined), blank url/uuid inputs become undefined while junk values reject; its output always re-parses through the storage schema
  - sections.tsx: GallerySection, TestimonialsSection, FaqSection, FeaturedServiceSection renderers added (owner images bypass the optimizer); hero/about/why-us/booking-cta read optional authored overrides with dictionary fallbacks; home page passes live services for featured resolution
  - HomepageEditor: per-type dynamic forms (text pairs en/ne tabs, textareas, image URL rows, repeaters with add/remove/caps, featured service picker from active services), enable toggles and reorder kept; save posts drafts through saveHomepageAction which validates via the input schema and replaces the JSONB wholesale
  - homepage-drafts.ts bridges storage union to editor draft state both directions; dictionaries expanded in en and ne (section labels already present, plus field/action/error keys)
  - Tests: twelve new cases over storage strictness (defaults, stripping, caps, required item fields) and input coercion (blank collapse, row dropping, junk rejection) including a storage round-trip invariant
- Verified live: seeded rich content directly into shops.homepage and asserted eighteen markers across en and ne (per-locale overrides, en-only/ne-only fallbacks, featured service name resolution, gallery alt, FAQ items); one payload key mismatch caught (why-us uses description, not subtitle) and confirmed schema plus renderer agree; admin editor pages 200 signed-in in both locales
- Mid-session the shop owner saved real content through the editor UI concurrently; verification switched to snapshot-patch-restore around it and finished byte-identical, proving the full client to action to schema to DB path with real usage
- All checks green: format, lint, typecheck, 107 tests

### 2026-08-24 (session 17)

- Contrast validation wired into the theme builder:
  - theme-css.ts exports resolvePalettes (override merge shared by buildThemeStyle and the action)
  - saveBrandingAction returns BrandingResult with warnings from checkPalette over both merged schemes; pair strings are stripped of their scheme suffix and returned structured
  - useSettingsSubmit captures warnings from ok results; SaveBar renders a warning slot; appearance editor maps pairs/schemes through new dictionary keys (contrastWarning template, five contrastPairs, two schemes) in en and ne
- All checks green: format, lint, typecheck, 95 tests; appearance page re-verified live

### 2026-08-24 (session 16)

- Phase 11 theme and homepage customization admin (core complete):
  - buildThemeStyle now accepts customTheme overrides: light/dark color patches merge over the chosen preset per known key and a style id (standard/soft/deep) swaps the radius/shadow family; unknown style ids fall back to the preset's own scale (unit tested)
  - brandingConfigSchema.customTheme is a typed shape (per scheme partial color records limited to the ten builder keys, css color strings, style enum); SCALE_STYLES exported from presets.ts
  - /admin/settings/appearance: preset swatch cards (light/dark strips), font pairing pills, corner style toggle, per scheme custom color rows (hex/rgba text input with live swatch and clear), logo/favicon URL fields; the draft renders live by writing the same CSS variables buildThemeStyle emits straight onto document.documentElement, save persists through saveBrandingAction (whole object replace) and refreshes so the server layout re-emits identical vars
  - /admin/settings/homepage: numbered section list with enable toggles, up/down reordering, unknown-yet-configured types trail disabled; save validates shape plus uniqueness and replaces the homepage JSONB wholesale; content stays a permissive passthrough until the content model phase
  - Settings hub gains appearance + homepage cards; dictionary additions in en and ne incl. thirteen section labels
- Verified live: appearance and homepage pages return 200 in en and ne with real seed data; no leaked translation keys; theme-css override merge covered by two new unit tests
- All checks green: format, lint, typecheck, 95 tests

### 2026-08-24 (session 15)

- Phase 10 shop configuration admin complete:
  - src/db/repositories/shop-config.ts: services CRUD plus display order rewrite, barbers CRUD with wholesale service assignment via barber_services, hours replace-all per scope (shop or single barber) in one transaction, breaks and closures create/delete, booking rules and shop profile updates; hard deletes gated on zero appointment references since appointments FKs are ON DELETE RESTRICT (IN_USE returned instead)
  - src/lib/validation/admin.ts: authored input shapes mirroring the JSONB column contracts; LocalizedInput requires en, optional ne collapses to undefined so resolveLocalizedText fallback keeps working
  - src/lib/admin/settings-actions.ts ("use server"): zod validated mutations returning SettingsActionResult discriminated unions; saveScheduleAction rejects overlapping intervals per weekday server side even though the client also sorts them
  - Settings hub at /admin/settings with five cards: services, barbers, schedule, rules, general; AdminNav gains the settings tab
  - Services manager: inline editor card (en/ne name, description, duration, buffer, paisa price), activate/deactivate, up/down reorder through full id list submit, two step delete confirm with IN_USE explanation
  - Barbers manager: cards with initials avatar, bio in en/ne, service chips as toggle checkboxes persisted through setBarberServices replace-all
  - Schedule page: scope switcher (?scope=shop or barber id), seven weekday rows of time interval pairs with add/remove, closed label when empty, key={scopeId} remounts local draft when switching scope; breaks section (weekly weekday picker or one-off date, time range, reason, barber scope select) and closures section (date range, full day vs partial with times)
  - Booking rules form edits the existing bookingRulesSchema fields incl. optional daily cap left empty for unlimited; general form covers shop identity strings, contact JSONB, location JSONB, social links JSONB (blank inputs collapse to undefined keys)
  - Shared client helpers in components/admin/settings-bits.tsx: LocalizedField, Field, SaveBar, useSettingsSubmit wrapping pending/saved/error state around direct server action calls
- Dictionaries: admin.settings block fully expanded in en, ne mirror complete including weekday reuse from top level weekdays.long*
- Verified live against dev server: all six settings routes return 200 signed-in in en and ne; schedule renders shop scope and barber scope (200); anonymous still redirects 307
- All checks green: format, lint, typecheck, 93 tests

### 2026-08-24 (session 14)

- Phase 9 admin operations complete:
  - src/db/repositories/admin.ts: listAppointmentsBetween, listUpcomingAppointments, getAppointmentDetail (adds email, notes, cancel reason, duration), listCustomers with ilike search and visit counts (aggregate timestamps coerced defensively: drivers may hand back strings), getCustomerHistory, listActiveBarbers, getServiceTiming for reschedule probes
  - src/lib/admin/actions.ts ("use server"): setAppointmentStatusAction guarded by a TRANSITIONS map (AD-20), updateAdminNotesAction, rescheduleByStaffAction reusing barbersForExactSlot with the appointment's own range filtered out of busy and buffer from the live service row; Postgres 23P01 walked through the drizzle cause chain maps to SLOT_UNAVAILABLE
  - Admin shell: layout requires OWNER once via requireOwner, noindex metadata, responsive AdminNav (top pills on desktop, fixed bottom tab bar on mobile); sign-out button takes its label from dictionaries
  - Dashboard: stats grid (today count, pending, revenue today from COMPLETED price snapshots, completed today), next up card, warnings for PENDING inside a three hour window, today's appointments grouped by morning/afternoon/evening
  - Calendar: day timeline / week grid (Sunday start, today ringed) / flat list views driven by ?view=&date= links; rows link into detail pages
  - Appointment detail: snapshot fields, status chip translated via manage.status_* keys, staff actions (confirm/complete/no-show inline buttons, cancel with optional reason two step, reschedule panel reusing SlotPicker pinned to the barber), internal notes editor persisting through updateAdminNotesAction
  - Customers page: search form over name and phone, cards with visit counts and last seen dates, Sheet based history drawer rendering server side history rows
  - Dictionaries: admin block fully expanded in en, ne mirror covers nav/stats/warnings/calendar/appointments/customers headings; no leaked keys in rendered HTML
- Verified live against dev server: anonymous /admin redirects 307 to localized sign-in in both locales; signed-in owner sees dashboard, calendar day/week/list, customers (+search), and detail pages return 200 in en and ne with real seed data
- Staff mutations verified by typecheck contracts and guard behavior live; full click-through of actions deferred to the QA phase
- All checks green: format, lint, typecheck, 93 tests

### 2026-08-24 (session 13)

- Phase 8 public customer experience complete:
  - Route group src/app/[locale]/(public) owns the customer chrome: SiteHeader (shop identity, nav, LanguageSwitcher, book pill) and SiteFooter; admin and sign-in stay outside the group (AD-17)
  - Home page renders enabled shop.homepage sections through a registry: hero, services, barbers (live catalog), about, opening hours (merged intervals, today highlighted via epochToZonedParts), location with Google Maps deep link, contact chips (tel/wa.me/mailto), booking CTA; content dependent types (gallery/testimonials/faq/featured) render null until phase 11 ships their editor
  - Services and barbers pages list active rows with per item book links carrying ?service= / ?barber= prefills into the wizard
  - Booking wizard (client): SERVICE to BARBER to TIME to DETAILS to REVIEW stepper with progress dots; SlotPicker fetches availability per seven day chunk through getAvailabilityAction, shows disabled chips for blocked starts, day strip with closed days dimmed; details validated against the same shapes as the zod boundary; review confirms through createBookingAction
  - Conflict recovery: SLOT_UNAVAILABLE and RULE_VIOLATION PAST/MIN_NOTICE show the conflict banner, bump the picker refresh signal so slots refetch, keep the customer on the time step; other codes map to dictionary messages keyed by BookingErrorCode
  - Confirmation screen links manage/{token} and /api/manage/{token}/ics
  - Manage flow: /[locale]/manage token entry page; /[locale]/manage/[token] renders status badge with tone mapping, snapshot fields resolved against the active locale, cancel deadline note, inline two step cancel confirm, reschedule panel reusing SlotPicker pinned to the appointment's own barber, add to calendar, book again; getManageModel in core.ts serves the page one read including serviceId/barberId the view deliberately omits
  - ICS route handler: RFC 5545 escaping, UTC basic timestamps, shop boundary enforced, 410 once cancelled, no-store
  - Dictionaries expanded for every new surface in en plus ne mirror (book steps/errors/slot labels, manage statuses/actions/deadline note, footer); translate falls back to English per key
  - React purity lint compliance: Date.now isolated behind currentInstantMs helper; slot picker cache keyed by selection signature instead of clearing effects (no synchronous setState in effects)
- Race test hardened: pins hariBarberId so the exclusion constraint is the arbiter; with ANY two winners could legitimately take different chairs when one transaction's busy read lands after the other's commit (AD-19)
- Verified live against dev server: en and ne home/services/barbers/book/manage return 200 with real seed data; seeded PENDING appointment round trips through manage page (details, deadline note, actions) and ICS download (correct 04:15Z for 10:00 Kathmandu); garbage tokens 404 on both manage page and ICS; smoke row removed afterwards
- All checks green: format, lint, typecheck, 93 tests. Production build still deferred while dev server holds .next

### 2026-08-24 (session 12)

- Phase 7 booking pipeline complete:
  - src/lib/booking/core.ts: getAvailabilityCore (engine input assembled from repositories), createBookingCore, cancelByCustomerCore, rescheduleByCustomerCore, lookupAppointmentCore; every mutation rechecks capacity inside its transaction and treats the appointments_no_double_booking exclusion constraint as final arbiter
  - src/lib/booking/actions.ts ("use server"): validate with zod, resolve shop via getShopContext, rate limit per client IP and action (AD-15), delegate to core; results are discriminated unions, never thrown domain errors
  - src/lib/booking/token.ts: 256 bit random lookup tokens in base64url, only SHA-256 stored, constant time compare
  - src/db/repositories/booking.ts: shop scoped schedule loaders (hours, breaks, closures), busy ranges overlapping a window, eligible barbers with display names for snapshots, customer upsert keyed on shop plus phone, daily booking count
  - src/lib/validation/booking.ts: public boundary schemas (date keys, wall times, loose phone, ANY or uuid barber selection, seven day availability window cap, token shape)
  - src/lib/rate-limit.ts: sliding window buckets with opportunistic sweep; single instance today, Redis behind the same signature later
  - Vitest env setup loads .env.local before module scope reads it; server-only stubbed for tests
  - Integration suite against local Postgres (self skipping): race test proves exactly one winner of two concurrent bookings on the same slot, loser receives SLOT_UNAVAILABLE through error code 23P01 found by walking drizzle's cause chain (AD-16); plus ANY-barber booking with token lookup and cancel state machine, and maxDailyBookingsPerCustomer enforcement counted over the calendar day
- All checks green: format, lint, typecheck, 93 tests total. Production build deferred while the dev server holds .next; no routes import the new actions yet

### 2026-08-24 (session 11)

- Phase 6 scheduling engine complete in src/lib/scheduling (pure functions, no DB, no UI):
  - interval.ts: half-open [start, end) range math: overlaps, merge, subtract, containment
  - format.ts: dateKey/wallTime helpers built on TZDate from @date-fns/tz so every wall clock string is interpreted in the shop zone (Kathmandu +05:45 verified)
  - hours.ts: shop/barber window expansion (barber rows replace shop rows per weekday), recurring and one-off breaks, full and partial closures by scope, busy epoch projection onto day segments including midnight crossing tails
  - slots.ts: grid starts aligned on a global interval grid across merged windows; footprint fit requires duration + trailing buffer inside ONE contiguous free window; blocker classification with closure over break over booked priority
  - rules.ts: PAST / MIN_NOTICE / MAX_ADVANCE precedence with exact boundaries allowed, cancel and reschedule deadline checks
  - availability.ts: getAvailability composition returning slots with per-slot eligible barberIds for ANY-barber booking plus barbersForExactSlot recheck hook that accepts extraBusy for the phase 7 transactional anti-double-booking check
  - Design choice (AD-14): grid spans raw working hours so blocked minutes stay visible as disabled chips with reasons instead of unexplained holes
- Tests: 48 new Vitest cases covering the spec section 74 matrix, spec closing-boundary example (17:30 cannot start a 45 minute service ending 18:00), buffer tails blocking later starts, multi-barber unions, ANY-barber filtering, midnight-crossing projection, cancelled appointments ignored, DST spring forward (identical wall times 47h apart), Kathmandu odd offset epochs
- Caught by the suite along the way: freeWindowsForBarber silently dropped its busy argument under vitest's esbuild transform (no typecheck at test time) which erased all appointment blocking; fixed and covered
- All checks green: format, lint, typecheck, 84 tests total, no app routes touched

### 2026-08-24 (session 10)

- Rebuilt the barber themed error surfaces from scratch (previous session ran out of tokens and the commit was finished by another model):
  - BarberPole redesigned as a wall mounted pole: inset mounting caps, card shadow core, glass sheen strip; still token only, still seamless, still frozen by reduced motion
  - New shared ErrorSurface component: one card composition (pole, mono eyebrow badge, title, subtitle, hairline, single action) used by all four boundaries; entrance uses the stagger utility
  - Copy rewritten in en and ne with more personality: "This page isn't on the menu." / "Snagged the wire." plus Nepali equivalents
  - Added the missing global-error.tsx so root layout crashes match the aesthetic instead of the stock page; owns html/body, loads the token stylesheet and Geist, offers retry and shows the digest ref
  - global-not-found.tsx now imports globals.css and loads Geist and Geist Mono itself; as a layout bypassing document it received no styles before, which shipped an unstyled 404
  - Extracted the duplicated pre paint scheme script into src/lib/scheme-script.ts, now shared by [locale] layout, global-not-found and global-error
  - /style showcase gained an Error surfaces section with three pole sizes and a mini 404 preview
- Verified live: /aa, /en/nope, /ne/nope all return the styled custom 404 with stylesheet attached; a temporary throwing route proved the [locale] boundary ships its full ErrorSurface tree for client side render (thrown server errors hydrate the boundary per React streaming semantics); production build green including both standalone documents
- All checks green: format, lint, typecheck, 36 tests passing, production build

### 2026-08-23 (session 9)

- Barber themed error surfaces:
  - BarberPole component: animated diagonal red/white/accent stripes drawn purely from theme tokens so it restyles with every preset; seamless loop via full period translation, frozen automatically by the reduced motion guard
  - global-not-found.tsx (experimental.globalNotFound): full document 404 for unmatched URLs including invalid locale prefixes, carries its own styles and scheme script
  - [locale] not-found and error boundaries reuse the same visual language; error boundary offers retry and shows the digest ref
  - Copy added to dictionaries en and ne ("This cut isn't on the menu." / "यो कट मेनुमा छैन।")
  - Fixed hydration mismatch in FeedbackPrefsDemo: stored haptics/sound flags now read through useSyncExternalStore instead of setState during render
- Verified live: /en/nope, /ne/nope and /fr-FR/deep/path all return 404 with the custom page

### 2026-08-23 (session 8)

- Fixed two runtime console errors on /style:
  - Popover wrapped its trigger Button in a second button, causing nested button hydration errors; it now injects onClick and aria attributes onto the trigger element via cloneElement
  - Pre paint scheme script rendered inside a manual head tag triggered the client script warning; replaced with the documented InlineScript pattern (text/javascript on server, text/plain on client, suppressHydrationWarning) at the top of body
- Phase 5 complete:
  - Routes restructured under src/app/[locale] with that layout as the root layout (html lang per locale); api/auth stays locale free
  - Locale negotiation in proxy.ts: grooma.locale cookie first, then hand rolled Accept-Language quality parsing, then en; unknown paths redirect to /{locale}/... and persist the negotiated choice; admin cookie gate now runs after stripping the locale prefix and redirects to the localized sign-in
  - Typed dictionaries: en base defines Dictionary, ne typed DeepPartial so missing keys are legal; dotted TranslationKey union gives compile-time key checking at call sites; resolver falls back to English per key and interpolates {vars}
  - Server access via getLocale/getTranslator built on next/root-params locale() getter (fails the build if imported into client bundles); client access via LocaleProvider + useT
  - Language switcher swaps the URL locale segment, persists through a server action (cookies store), then refreshes; mounted on the home page
  - Formatting helpers for dates, times, currency (NPR from integer paisa) and numbers pinned to Asia/Kathmandu; hreflang alternates builder
  - Home, sign-in, sign-in form, admin shell and sign out button fully routed through dictionaries; auth session redirects localized via root params
  - Verified live: / redirects to /en setting the cookie, Accept-Language ne redirects to /ne, both locales render with correct lang attribute and Devanagari, admin gate preserves locale in next param, dead sessions redirect to the localized sign-in
  - All checks green: format, lint, typecheck, 36 tests passing, production build with all routes dynamic

### 2026-08-23 (session 7)

- Phase 4 complete:
  - Preset library src/lib/theme/presets.ts: seven presets, each with a light and dark palette plus a radius and shadow scale. Standard scale for modern themes, soft flat scale for Minimal and Editorial, deep warm scale for Classic Barbershop and Midnight
  - Unknown preset ids in the database fall back to Classic Barbershop so a bad value can never blank the surface
  - Curated font pairings src/lib/theme/fonts.ts: Geist default, Oswald with Inter for classic voices, Playfair Display with Inter for editorial; Inter, Oswald and Playfair Display preloaded once via next/font
  - Emitter src/lib/theme/theme-css.ts converts branding into inline custom properties on html: light palette rides --tl-, dark rides --td-, scheme independent scale and fonts ride --t-
  - globals.css rewired to consume those variables with standalone fallbacks mirroring the baseline; @theme inline now also maps the themeable radius and shadow tokens and the heading font
  - Root layout resolves shop branding per request (connection() keeps routes dynamic) and spreads the theme style onto html; database unreachable falls back to baseline so builds never break
  - Contrast validator src/lib/theme/contrast.ts: WCAG luminance math, rgba compositing over backgrounds, body text checked at 4.5:1 and UI component pairs at 3:1
  - Tests: every preset validated in both schemes plus emitter coverage for emission, fallbacks and pairing mapping (25 tests total)
  - Verified live against the running dev server: home page serves --tl-accent #84572a for the seeded Classic preset, switching branding to Ocean in the database restyled the page to #0d6e8c with Oswald headings on the next request without a rebuild, then reverted
  - No hex values anywhere outside globals.css and the theme modules

### 2026-08-23 (session 6)

- Phase 3 complete:
  - Semantic token layer in globals.css: surfaces (background, card, inset, backdrop), labels, separator, accent, destructive, success, warning; light values on :root and dark overrides via .dark with a pre paint script syncing system preference
  - @theme inline maps tokens to Tailwind utilities so Phase 4 presets can restyle by overriding variables only
  - Motion tokens: spring and soft easings, fade/scale/slide/toast keyframes, stagger utility for lists up to 12 children, prefers-reduced-motion guard
  - Safe area utilities pt-safe, pb-safe, pl-safe, pr-safe; viewport export with viewportFit cover and theme colors
  - Noto Sans Devanagari loaded as companion face in the body font stack
  - Primitives: Button (5 variants, 3 sizes, loading), IconButton, Card family, InsetGroup rows, Badge, Avatar, Skeleton, EmptyState
  - Forms: Field, Input, Textarea, Select, iOS style Switch, SegmentedControl with arrow key support
  - Overlays: Sheet (bottom sheet mobile, dialog desktop), AlertDialog, Toast provider with useToast, Popover, Tooltip; escape and focus restoration handled
  - Tabs with roving arrow key focus; haptics utility over Vibration API gated by preference (default on); WebAudio sound synth gated by preference (default off)
  - Preference store src/lib/preferences.ts with injectable storage covered by unit tests plus haptics pattern tests (18 tests total)
  - Living showcase at /style covering tokens, typography with Devanagari samples, every primitive, motion replays and feedback toggles; home page links to it
  - Sign-in form and admin sign out refit to Button, Card, Field, Input primitives
  - All checks green: format, lint, typecheck, 18 tests passing, production build with /style prerendered

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
