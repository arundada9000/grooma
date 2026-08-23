# Barber Booking Platform — Master Product & Development Prompt

name : Grooma

tagline : Your grooming, made simple.

## 1. ROLE

You are a senior full-stack product engineer, software architect, UI/UX designer, accessibility specialist, PWA engineer, and technical SEO expert.

Build a **production-quality, multi-tenant barber appointment and business management platform**.

This is not a demo, toy project, static mockup, or generic CRUD dashboard.

The goal is to create a polished product that can be used by multiple independent barber shops. Each barber shop should be able to configure its own branding, theme, services, barbers, schedules, business information, homepage content, booking rules, and customer-facing experience without changing source code.

The product must feel like a premium modern consumer application while remaining simple enough for a real barber shop owner to operate.

Prioritize:

- Excellent UX
- Mobile-first design
- iOS Human Interface Guidelines-inspired interaction patterns
- Premium visual design
- Performance
- Accessibility
- Security
- Maintainability
- Correct appointment scheduling
- Multi-tenancy
- Configurability
- SEO/AEO/GEO
- PWA quality
- Production readiness

Do not sacrifice architecture or correctness merely to make the UI look impressive.

---

# 2. PRODUCT VISION

Create a platform where a barber shop can have its own beautiful online presence and appointment system.

A customer should be able to:

1. Discover a barber shop.
2. View its services.
3. View its barbers.
4. View opening hours and location.
5. See real-time appointment availability.
6. Select a service.
7. Select a preferred barber or "Any available barber".
8. Select a date.
9. Select an available time.
10. Enter their details.
11. Book an appointment.
12. Receive confirmation.
13. View the appointment.
14. Reschedule or cancel when permitted.
15. Add the appointment to their calendar.
16. Install the website as a PWA.
17. Receive notifications where supported.

A barber/shop owner should be able to:

- Configure the shop
- Manage branding
- Select a theme
- Create a custom theme
- Manage services
- Set service durations
- Set prices
- Manage barbers
- Manage working schedules
- Configure breaks
- Configure holidays
- Block time
- Manage appointments
- Manage customers
- Configure booking rules
- Manage homepage content
- Manage gallery
- Configure notifications
- View basic business statistics

The platform must support multiple independent shops without their data ever leaking across tenants.

---

# 3. CORE ARCHITECTURAL PRINCIPLE

This is a **multi-tenant SaaS-ready architecture**.

Never assume there is only one barber shop.

Every tenant-specific entity must belong to a shop/tenant.

Conceptually:

```text
Platform
│
├── Shop A
│   ├── Branding
│   ├── Theme
│   ├── Homepage
│   ├── Services
│   ├── Barbers
│   ├── Customers
│   ├── Appointments
│   └── Settings
│
├── Shop B
│   ├── Branding
│   ├── Theme
│   ├── Homepage
│   ├── Services
│   ├── Barbers
│   ├── Customers
│   └── Appointments
│
└── Shop C
```

Tenant isolation is a hard security requirement.

Never rely only on frontend filtering to isolate tenants.

Every server-side operation involving tenant data must validate tenant ownership/context.

---

# 4. TECHNOLOGY STACK

Use the following stack unless there is a compelling technical reason to change something. Do not randomly introduce alternative technologies.

## Core

- Next.js 16+
- React
- TypeScript
- App Router

Use Server Components by default and Client Components only where interactivity requires them.

## Styling

- Tailwind CSS 4
- CSS custom properties for theme tokens

## UI

- shadcn/ui
- Radix UI primitives
- Lucide icons

Build a coherent internal design system rather than styling every page independently.

## Animation

- Motion for React / Framer Motion

Animations must be purposeful and performant.

## Database

- PostgreSQL

## ORM

- Drizzle ORM

## Validation

- Zod

## Forms

- React Hook Form
- Zod integration

## Authentication

- Auth.js or the most appropriate current Next.js-compatible authentication solution

Authentication must be secure and server-validated.

## PWA

- Serwist or an equivalent mature service-worker/PWA implementation
- Web App Manifest
- Service worker
- Offline application shell
- Installability
- PWA shortcuts
- Push notification architecture where supported

## Dates

- date-fns
- date-fns-tz

Use explicit timezone handling.

Default timezone for Nepal-based deployments should be:

```text
Asia/Kathmandu
```

but timezone must be configurable per shop.

## Email

- Resend or equivalent transactional email provider

Create a notification abstraction so SMS, WhatsApp, email, and push can be added later without rewriting business logic.

## Storage

Use S3-compatible object storage or Cloudinary for:

- Logos
- Barber photos
- Gallery images
- Homepage images

Do not store large binary images directly in PostgreSQL.

## Testing

- Vitest
- Playwright

## Code quality

- TypeScript strict mode
- ESLint
- Prettier
- GitHub Actions

## Deployment

Design for:

- Vercel
- Managed PostgreSQL such as Neon

---

# 5. MULTI-TENANT MODEL

The platform must support multiple shops.

A shop should have a unique public identity.

For example:

```text
/barbershop-name
```

or a future subdomain architecture such as:

```text
barbershop-name.example.com
```

Do not hardcode one shop anywhere in the application.

The shop identity must come from the database/context.

The architecture should make future custom domains possible.

---

# 6. SHOP CONFIGURATION

The most important requirement:

## Business information must NOT be hardcoded.

A new shop should be able to change its information from the admin panel.

Configurable fields should include:

### Identity

- Shop name
- Short name
- Slug
- Logo
- Favicon
- Tagline
- Description

### Contact

- Phone
- Email
- WhatsApp
- Website
- Social media links

### Location

- Address
- City
- Province/state
- Country
- Postal code
- Latitude
- Longitude
- Google Maps URL

### Business information

- Opening hours
- Timezone
- Booking policies
- Cancellation policy
- Rescheduling policy

### Branding

- Theme
- Colors
- Typography
- Logo
- Images
- UI preferences

### Homepage

- Hero content
- Featured services
- Featured barbers
- About section
- Gallery
- Testimonials
- FAQ
- CTA
- Location
- Contact
- Opening hours

The codebase must contain sensible defaults, but production content must come from configuration/data.

---

# 7. THEME SYSTEM

Build a first-class theme engine.

Do NOT hardcode colors throughout components.

Use semantic design tokens and CSS variables.

Example:

```text
--color-background
--color-surface
--color-surface-elevated
--color-primary
--color-secondary
--color-accent
--color-text
--color-text-muted
--color-border
--color-success
--color-warning
--color-danger

--radius-sm
--radius-md
--radius-lg
--radius-xl

--shadow-sm
--shadow-md
--shadow-lg

--font-heading
--font-body
```

The entire UI must consume semantic tokens.

---

# 8. THEME PRESETS

Provide several professionally designed theme presets.

Do not create lazy recolors of the same interface.

Each preset should have a distinct visual personality while maintaining the same UX system.

Examples:

### Classic Barbershop

Traditional, sophisticated, masculine.

### Midnight

Dark luxury.

### Minimal

Clean monochrome modern design.

### Copper

Warm premium aesthetic.

### Emerald

Luxury green/cream aesthetic.

### Ocean

Modern deep-blue aesthetic.

### Editorial

Typography-focused premium style.

### Custom

Fully configurable.

Feel free to create additional high-quality presets.

Themes must affect:

- Colors
- Typography
- Surfaces
- Borders
- Radius
- Shadows
- Button appearance
- Card appearance
- Navigation
- Background treatments
- Hero presentation
- Accent elements

Do not allow themes to break accessibility or readability.

---

# 9. CUSTOM THEME BUILDER

Admin should be able to create a custom theme.

Allow configuration of:

### Colors

- Primary
- Secondary
- Accent
- Background
- Surface
- Elevated surface
- Text
- Muted text
- Border
- Success
- Warning
- Danger

### Typography

Use a curated list of supported fonts.

Examples:

- Inter
- DM Sans
- Manrope
- Plus Jakarta Sans
- Space Grotesk
- Playfair Display
- Cormorant Garamond
- Lora

Allow separate heading/body font selections.

### Shape

- Border radius scale
- Button radius
- Card radius

### Visual style

- Minimal
- Soft
- Glass
- Solid
- Editorial

Provide a **live preview** before saving.

Validate contrast ratios.

Never allow a custom theme to make essential UI inaccessible.

---

# 10. HOMEPAGE BUILDER — LIMITED, NOT A FULL WEBSITE BUILDER

The shop owner should be able to customize the landing page without touching code.

Do NOT build a full Wix-like drag-and-drop page builder.

Instead provide predefined high-quality sections with:

- Enable/disable
- Reorder
- Content editing
- Image selection
- CTA configuration

Available sections:

- Hero
- Services
- Featured service
- Barbers
- About
- Why choose us
- Gallery
- Testimonials
- FAQ
- Opening hours
- Location
- Contact
- Booking CTA

Each section must have excellent responsive defaults.

---

# 11. LANDING PAGE

The public homepage is extremely important.

It should feel like a premium website for an actual barber shop.

Do not create a generic SaaS landing page.

It should have:

- Strong visual hierarchy
- Premium typography
- Excellent photography
- Responsive hero
- Clear booking CTA
- Service discovery
- Barber profiles
- Shop story
- Gallery
- Social proof
- Location
- Opening hours
- Strong final CTA

The design must be customizable by theme and shop content.

The page should work even if the shop has minimal content.

---

# 12. DESIGN PHILOSOPHY

Use **Apple Human Interface Guidelines-inspired principles** without copying Apple's visual identity.

Prioritize:

- Clarity
- Deference
- Depth
- Strong hierarchy
- Generous spacing
- Large readable typography
- Clear primary actions
- Contextual controls
- Natural motion
- Touch-first interaction
- Minimal visual clutter
- Consistent component behavior

The result should feel like:

> A premium native-quality application delivered through the web.

Avoid:

- Generic bootstrap layouts
- Excessive gradients
- Excessive glassmorphism
- Giant text everywhere
- Over-rounded everything
- Excessive shadows
- Random animations
- Dashboard-template aesthetics
- Visual clutter

---

# 13. RESPONSIVE DESIGN

Design mobile-first.

The application must work beautifully on:

- Small phones
- Modern iPhones
- Android phones
- Tablets
- iPads
- Laptops
- Large desktop monitors

Do not simply shrink the desktop layout.

Navigation, sheets, dialogs, tables, calendars, cards, and forms should adapt appropriately.

---

# 14. MOBILE UX

Use mobile-native interaction patterns.

Examples:

- Bottom navigation where appropriate
- Bottom sheets
- Sticky booking CTA
- Large touch targets
- Swipe-friendly interactions where useful
- Native-feeling pickers
- Safe-area support
- Sticky action areas

Avoid desktop-style interfaces squeezed onto mobile.

---

# 15. MODALS, SHEETS, ALERTS

Use Radix/shadcn primitives.

On mobile, prefer:

- Bottom sheets
- Full-screen sheets for complex flows

On desktop:

- Dialogs
- Popovers

Never use browser `alert()`, `confirm()`, or `prompt()`.

Build polished:

- Confirmation dialogs
- Destructive-action confirmations
- Success states
- Error states
- Toast notifications
- Inline validation
- Loading states

---

# 16. ANIMATION SYSTEM

Use Motion for React.

Create consistent animation primitives.

Animations should include:

- Page transitions
- Modal/sheet transitions
- Button press feedback
- Card interactions
- Calendar transitions
- Booking-step transitions
- Success animations
- Toast entry/exit
- Navigation transitions
- Loading transitions

Respect:

```text
prefers-reduced-motion
```

When reduced motion is enabled, significantly reduce or disable non-essential movement.

Do not animate everything.

Performance is more important than spectacle.

---

# 17. CUSTOMER BOOKING FLOW

Build a highly polished booking experience.

Recommended flow:

```text
Service
   ↓
Barber
   ↓
Date
   ↓
Time
   ↓
Customer details
   ↓
Review
   ↓
Confirmation
```

Allow sensible shortcuts.

For example:

```text
Service
→ Date
→ Available barber/time
```

if "Any available barber" is selected.

---

# 18. SERVICES

Each service must support:

```text
id
shopId
name
description
duration
bufferDuration
price
image
active
displayOrder
createdAt
updatedAt
```

Examples:

- Haircut
- Beard Trim
- Haircut + Beard
- Hair Wash
- Styling

Admin can:

- Create
- Edit
- Delete/deactivate
- Reorder
- Change price
- Change duration
- Change buffer
- Add description
- Add image

Historical appointments must retain the price and duration at booking time.

---

# 19. BARBERS

Each barber belongs to a shop.

Fields:

```text
id
shopId
name
displayName
bio
photo
active
displayOrder
```

Barbers can have:

- Services they provide
- Working schedules
- Breaks
- Days off
- Blocked periods

Customers can select:

```text
Any available barber
```

or a specific barber.

---

# 20. WORKING HOURS

Support per-day schedules.

Example:

```text
Monday
09:00 - 13:00
14:00 - 18:00

Tuesday
09:00 - 18:00

Sunday
Closed
```

Support multiple intervals per day.

Schedules can exist at:

- Shop level
- Barber level

Barber-specific availability must override general shop availability where appropriate.

---

# 21. BREAKS

Support:

### Recurring breaks

Example:

```text
Every day
13:00 - 14:00
```

### One-off blocked periods

Example:

```text
August 29
15:00 - 17:00
Reason: Personal appointment
```

---

# 22. HOLIDAYS / CLOSURES

Admin can close:

- Entire shop
- Individual barber

Support:

- Full-day closures
- Partial-day closures

Examples:

```text
Public holiday
Shop maintenance
Personal leave
Emergency closure
```

No customer should be able to book unavailable periods.

---

# 23. BOOKING RULES

Configurable per shop:

### Slot interval

Default:

```text
15 minutes
```

### Minimum advance booking

Example:

```text
30 minutes
```

### Maximum advance booking

Example:

```text
30 days
```

### Cancellation deadline

Example:

```text
2 hours before appointment
```

### Rescheduling deadline

Example:

```text
2 hours before appointment
```

### Maximum daily bookings

Allow optional configuration if useful.

---

# 24. AVAILABILITY ENGINE

This is one of the most important pieces of the entire system.

Availability must be calculated server-side.

A time is available only if:

```text
Within shop working hours
AND
Barber works during that period
AND
Service duration fits
AND
Service buffer fits
AND
No appointment overlaps
AND
No break overlaps
AND
No blocked period overlaps
AND
No shop closure overlaps
AND
Booking rules allow it
```

Example:

```text
Shop closes at 18:00
Service duration = 45 minutes

17:00 → available
17:15 → available
17:30 → unavailable
17:45 → unavailable
```

because:

```text
17:30 + 45 minutes = 18:15
```

---

# 25. DO NOT STORE GENERATED SLOTS

Do not create thousands of database records such as:

```text
Slot 09:00
Slot 09:15
Slot 09:30
...
```

Availability should be derived from:

- Working hours
- Appointments
- Services
- Breaks
- Closures
- Booking rules

This makes scheduling flexible and maintainable.

---

# 26. DOUBLE-BOOKING PROTECTION

This is a critical backend requirement.

Never rely on frontend availability checks.

Two customers can open the same available slot simultaneously.

The booking system must protect against:

```text
Customer A → 10:30
Customer B → 10:30
```

when only one appointment is possible.

Use transactional/atomic server-side booking logic and appropriate database constraints/locking strategies.

The final booking operation must be concurrency-safe.

A successful availability check alone is NOT sufficient.

---

# 27. APPOINTMENT STATES

Use:

```text
PENDING
CONFIRMED
COMPLETED
CANCELLED
NO_SHOW
```

Appointment lifecycle:

```text
Customer books
      ↓
PENDING
      ↓
CONFIRMED
      ↓
COMPLETED
```

or:

```text
PENDING → CANCELLED
CONFIRMED → CANCELLED
CONFIRMED → NO_SHOW
```

Do not use a simple boolean such as `booked = true`.

---

# 28. APPOINTMENT DATA

An appointment should conceptually contain:

```text
id
shopId
customerId
barberId
serviceId

startTime
endTime

status

customerName
customerPhone
customerEmail

priceAtBooking
durationAtBooking

customerNotes

createdAt
updatedAt
```

Store historical snapshots such as:

```text
priceAtBooking
durationAtBooking
serviceNameAtBooking
barberNameAtBooking
```

where appropriate.

Changing a service later must not corrupt historical appointment records.

---

# 29. GUEST BOOKING

Do not require customers to create accounts just to book.

Guest-first booking should be the default.

Required:

- Name
- Phone

Optional:

- Email
- Notes

Customer accounts can be added later.

Provide an appointment lookup mechanism using secure verification rather than exposing appointments through an easily guessable ID.

---

# 30. APPOINTMENT MANAGEMENT

Customers should be able to:

- View appointment
- Cancel
- Reschedule
- Add to calendar
- Contact shop
- Get directions

Admin should be able to:

- Confirm
- Complete
- Cancel
- Reschedule
- Mark no-show
- Add notes

---

# 31. BOOK AGAIN

For returning customers, provide a convenient:

> Book again

experience.

Example:

```text
Your previous appointment

Haircut + Beard
45 minutes
Rs. 500

[Book Again]
```

Do not force customers through unnecessary steps.

---

# 32. CALENDAR

Admin dashboard should support:

### Today

Primary view.

### Day

Timeline view.

### Week

Schedule overview.

### List

Mobile-friendly appointment list.

Appointments should be visually differentiated by status.

---

# 33. ADMIN DASHBOARD

Dashboard should prioritize useful information.

Example:

```text
Today's appointments
Upcoming appointments
Completed appointments
Cancelled appointments
Today's estimated revenue
```

Also show:

- Next appointment
- Recent bookings
- Recent cancellations
- Schedule warnings
- Unconfirmed appointments

Avoid unnecessary analytics in the initial version.

---

# 34. CUSTOMER MANAGEMENT

Admin can see customers belonging to their shop.

Customer information:

```text
Name
Phone
Email
Appointment count
Last appointment
Upcoming appointment
Service history
Preferred barber if known
```

Keep CRM lightweight.

Do not build a giant CRM.

---

# 35. NOTIFICATION SYSTEM

Build a provider-independent notification architecture.

Conceptually:

```text
NotificationService
│
├── InAppProvider
├── PushProvider
├── EmailProvider
├── SMSProvider
└── WhatsAppProvider
```

Initially implement:

- In-app notifications
- Email architecture/provider

Design the abstraction so additional providers can be added later.

---

# 36. CUSTOMER NOTIFICATIONS

Support notifications for:

- Appointment booked
- Appointment confirmed
- Appointment cancelled
- Appointment rescheduled
- Appointment reminder
- Shop closure affecting appointment

---

# 37. ADMIN NOTIFICATIONS

Notify admins about:

- New appointment
- Appointment cancellation
- Rescheduling
- Important booking events

Provide unread counts and notification center.

---

# 38. PWA

The application must be a proper PWA.

Requirements:

- Web App Manifest
- Service worker
- Installable
- Standalone mode
- App icons
- Maskable icon where appropriate
- Splash/loading experience
- Theme color
- Offline shell
- Cache strategy
- PWA shortcuts
- Push notification architecture
- App badge where supported

Do not claim full offline functionality for booking.

The booking system requires network access.

Offline mode should provide an appropriate cached shell and graceful offline messaging.

---

# 39. ANDROID PWA

Support:

- Install prompts
- Standalone display
- PWA shortcuts
- Push notifications where supported
- App icon
- Splash screen
- Offline shell
- App badge where supported

---

# 40. IOS PWA

Pay particular attention to iOS Safari.

Support:

- `apple-mobile-web-app-capable`
- Standalone mode
- Apple touch icons
- Safe-area insets
- Correct viewport behavior
- iPhone/iPad responsive layouts
- Home-screen installation experience
- Web Push where supported by the platform
- iOS-specific install guidance when appropriate

Do not assume Android PWA APIs work identically on iOS.

Gracefully degrade unsupported features.

---

# 41. PWA SHORTCUTS

Provide shortcuts such as:

```text
Book Appointment
My Appointment
Today's Availability
```

where platform support exists.

---

# 42. SEO

The public shop pages must be highly optimized for search engines.

Generate:

- Dynamic title
- Dynamic description
- Canonical URL
- Open Graph metadata
- Twitter/X metadata
- Sitemap
- Robots configuration
- Favicons
- Web manifest
- Proper heading hierarchy

Each shop should have unique metadata generated from its configuration.

Do not hardcode one site's title/description.

---

# 43. LOCAL SEO / GEO

Optimize for local discovery.

Use consistent business information:

- Business name
- Address
- Phone
- Opening hours
- Location
- Website
- Social profiles

Implement appropriate structured data such as:

- `LocalBusiness`
- `BeautySalon` or the most appropriate supported business type
- `Service`
- `Person`
- `WebSite`
- `BreadcrumbList`
- `FAQPage` only where appropriate and compliant with current search guidelines

Do not keyword-stuff.

Content should read naturally.

---

# 44. AEO

Structure public content so answer engines can understand the business.

Clearly answer:

- What is the shop?
- Where is it?
- What services are offered?
- How much do they cost?
- How long do services take?
- What are the opening hours?
- Who are the barbers?
- How do customers book?
- How can customers contact the shop?

Provide an FAQ section with concise natural-language answers.

---

# 45. RICH SEARCH EXPERIENCE

Provide appropriate structured data and metadata to maximize eligibility for rich search presentation.

Ensure:

- Valid schema
- Consistent business information
- Crawlable public pages
- Strong internal linking
- Proper canonicalization
- Fast loading
- Mobile usability

Do not promise specific Google rich-result appearances; implement the technical requirements correctly.

---

# 46. ACCESSIBILITY

Target WCAG 2.2 AA principles.

Requirements:

- Semantic HTML
- Keyboard navigation
- Focus management
- Visible focus states
- Screen-reader support
- Accessible forms
- Proper labels
- Accessible dialogs
- Accessible sheets
- Accessible toasts
- Appropriate ARIA
- Good color contrast
- Touch target sizing
- Reduced-motion support

Never depend exclusively on color.

---

# 47. PERFORMANCE

Public pages must be extremely fast.

Prioritize:

- Server rendering
- Minimal client JavaScript
- Image optimization
- Responsive images
- Lazy loading
- Font optimization
- Efficient caching
- Streaming where appropriate
- Code splitting
- Small bundles

Avoid turning every component into a Client Component.

Do not ship unnecessary JavaScript.

Aim for excellent Core Web Vitals.

---

# 48. DESIGN SYSTEM

Create reusable components.

Examples:

```text
Button
IconButton
Card
Badge
Avatar
Dialog
Sheet
Drawer
Popover
Toast
Tooltip
Tabs
Calendar
DatePicker
TimeSlot
ServiceCard
BarberCard
AppointmentCard
BookingStepper
EmptyState
Skeleton
ErrorState
PageHeader
SectionHeader
BottomNavigation
```

Do not duplicate UI logic across pages.

---

# 49. BOOKING COMPONENTS

Build reusable booking components:

```text
ServiceSelector
BarberSelector
DateSelector
AvailabilityGrid
TimeSlotPicker
CustomerForm
BookingSummary
BookingConfirmation
AppointmentCard
```

The booking flow should be composable and reusable.

---

# 50. ADMIN COMPONENTS

Build reusable admin components:

```text
AdminSidebar
MobileAdminNav
DashboardCard
AppointmentTimeline
AppointmentTable
ServiceManager
BarberManager
ScheduleEditor
BreakEditor
ClosureManager
ThemeEditor
HomepageEditor
NotificationCenter
SettingsForm
```

---

# 51. CONFIGURATION ARCHITECTURE

Avoid hardcoded business values.

Bad:

```text
const shopName = "John's Barber";
```

Good:

```text
shop.name
```

Bad:

```text
const phone = "9800000000";
```

Good:

```text
shop.contact.phone
```

Bad:

```text
const openingTime = "09:00";
```

Good:

```text
shop.schedule
```

The system must be reusable for completely different shops.

---

# 52. CONTENT ARCHITECTURE

Shop content should live in the database/configuration layer.

Examples:

```text
Shop
ShopBranding
ShopTheme
ShopSettings
HomepageConfiguration
HomepageSection
SocialLink
GalleryImage
Testimonial
FAQ
```

The frontend renders these dynamically.

Provide sensible defaults when optional content does not exist.

---

# 53. SECURITY

Treat security as a first-class requirement.

Implement:

- Server-side authorization
- Tenant isolation
- Secure authentication
- Password hashing through the auth provider
- CSRF protection where relevant
- Input validation
- Output escaping
- Rate limiting on public booking endpoints
- Abuse protection
- Secure cookies
- Secure headers
- No sensitive data in client bundles
- No database credentials client-side
- No trusting client-provided shop IDs
- Audit-sensitive admin operations where appropriate

Never trust:

```text
shopId
userId
role
price
duration
barberId
```

provided by the client.

Revalidate everything server-side.

---

# 54. TENANT SECURITY

For every tenant-scoped operation:

```text
Request
 ↓
Authenticated/identified context
 ↓
Resolve shop
 ↓
Authorize access
 ↓
Query only authorized tenant data
```

Never perform:

```text
SELECT * FROM appointments WHERE id = ...
```

without verifying the appointment belongs to the current authorized tenant.

---

# 55. ADMIN ROLES

Initially support:

```text
OWNER
BARBER
```

Owner:

- Full shop configuration
- Services
- Staff
- Schedules
- Appointments
- Customers
- Theme
- Homepage
- Settings

Barber:

- View relevant appointments
- Manage own appointments
- Mark appointments completed/no-show where permitted
- View relevant customer information

Keep authorization extensible for future roles.

---

# 56. SHOP ONBOARDING

Design the architecture so a new barber shop can eventually go through onboarding.

Conceptual flow:

```text
Create shop
    ↓
Business information
    ↓
Branding
    ↓
Theme
    ↓
Services
    ↓
Barbers
    ↓
Working hours
    ↓
Booking rules
    ↓
Homepage
    ↓
Publish
```

The initial implementation can keep onboarding simple, but do not architect the system around manually editing database records.

---

# 57. SHOP PUBLIC URL

Design public shop URLs around tenant identity.

Example:

```text
/shop/[slug]
```

Booking:

```text
/shop/[slug]/book
```

Services:

```text
/shop/[slug]/services
```

The exact routing structure may be improved during implementation.

Ensure future custom-domain support is possible.

---

# 58. ADMIN ROUTES

Use a clear structure such as:

```text
/admin
/admin/appointments
/admin/calendar
/admin/customers
/admin/services
/admin/barbers
/admin/schedule
/admin/closures
/admin/theme
/admin/homepage
/admin/notifications
/admin/settings
```

Ensure all routes are protected server-side.

---

# 59. ERROR HANDLING

Every important operation needs:

- Loading state
- Empty state
- Success state
- Error state
- Retry capability where appropriate

Examples:

```text
No appointments today
No available times
Shop closed
Service unavailable
Network unavailable
Booking conflict
Session expired
Permission denied
```

Do not leave users staring at blank screens or infinite spinners.

---

# 60. BOOKING CONFLICT UX

If a slot becomes unavailable while the customer is booking:

Do not display a generic:

> Something went wrong.

Instead explain:

> That time was just booked by someone else.

Then immediately show:

> Other available times

This should be a polished recovery flow.

---

# 61. TIMEZONE AND DATE HANDLING

Never treat dates/times as simple strings throughout the system.

Use explicit timezone-aware logic.

Store timestamps consistently.

Render them using the shop's configured timezone.

Default:

```text
Asia/Kathmandu
```

but never hardcode this globally.

Pay particular attention to:

- Midnight boundaries
- Daylight saving changes for future international shops
- Appointment duration
- Date filtering
- Recurring schedules
- Shop closures

---

# 62. CALENDAR EXPORT

Allow customers to add appointments to their calendar.

Generate appropriate calendar events containing:

- Shop name
- Service
- Barber
- Start time
- End time
- Address
- Contact information
- Appointment details

Use a standards-compatible calendar format.

---

# 63. QR CODE

Each shop should have a booking QR code.

The admin should be able to view/download/print it.

Example destination:

```text
/shop/[slug]/book
```

Use QR generation dynamically.

---

# 64. SHOP CONTACT ACTIONS

Where information exists, provide convenient:

- Call
- WhatsApp
- Email
- Directions
- Website
- Social links

On mobile, these should use appropriate device actions.

---

# 65. ADMIN SETTINGS

Create a well-organized settings area.

Sections:

```text
General
Branding
Theme
Homepage
Services
Barbers
Schedule
Booking
Notifications
Location
Social
SEO
PWA
Account
```

Do not put everything into one enormous settings form.

---

# 66. USER PREFERENCES

Support useful preferences where appropriate.

Admin/barber:

- Light/dark/system appearance
- Calendar view
- Time format
- Week start day
- Notification preferences
- Compact/comfortable density where useful

Customer:

- Notification preferences
- Preferred barber
- Preferred service where account functionality exists
- Language readiness

Do not create configuration options merely for the sake of having options.

---

# 67. LIGHT / DARK / SYSTEM

The platform should support:

- Light
- Dark
- System

where appropriate.

However, shop theme presets may define their own intended aesthetic.

Ensure every theme works correctly in its supported appearance modes.

Do not force dark mode if the shop theme is explicitly light-only.

---

# 68. NOTIFICATION CENTER

Create a polished notification center.

Support:

- Read/unread
- Mark as read
- Mark all as read
- Notification grouping
- Relevant deep links

Examples:

```text
New appointment
Arun booked Haircut for 3:30 PM
```

Clicking the notification should navigate to the relevant appointment.

---

# 69. ANALYTICS

Keep analytics lightweight initially.

Useful metrics:

- Appointments today
- Appointments this week
- Completed
- Cancelled
- No-show
- Estimated revenue
- Popular services
- Popular barbers
- New customers
- Returning customers

Do not build a giant BI system.

---

# 70. DATABASE DESIGN

Use normalized relational models.

Likely entities include:

```text
User
Shop
ShopMember
ShopSettings
ShopBranding
ShopTheme
HomepageConfiguration
HomepageSection
Service
Barber
BarberService
WorkingHour
BarberWorkingHour
Break
Closure
Customer
Appointment
AppointmentHistory
Notification
GalleryImage
Testimonial
FAQ
SocialLink
```

Adjust the exact schema based on implementation requirements.

Use foreign keys and appropriate indexes.

---

# 71. DATABASE INDEXING

Pay attention to indexes for:

- shopId
- appointment dates
- barberId
- customerId
- serviceId
- appointment status
- slug
- notification read state

Availability queries must be efficient.

Do not retrieve entire appointment histories when only a date range is required.

---

# 72. HISTORICAL DATA

Never allow current configuration changes to rewrite history.

For example:

If:

```text
Haircut = Rs. 300
```

and an appointment is booked,

then later:

```text
Haircut = Rs. 400
```

the historical appointment must still show:

```text
Rs. 300
```

Similarly preserve relevant historical names/durations.

---

# 73. SEED DATA

Provide development seed data for multiple shops.

For example:

```text
Demo Classic Barbershop
Demo Modern Barber
Demo Luxury Barber
```

Each should have different:

- Theme
- Services
- Barbers
- Schedule
- Branding
- Content

This helps prove multi-tenancy actually works.

---

# 74. TESTING REQUIREMENTS

Write tests for the scheduling engine.

At minimum test:

- Normal availability
- Appointment overlap
- Partial overlap
- Exact boundary overlap
- Service duration
- Buffer duration
- Breaks
- Shop closures
- Barber closures
- Working hours
- Multiple working intervals
- Minimum booking notice
- Maximum booking window
- Cancellation deadline
- Rescheduling
- Multiple barbers
- Any available barber
- Concurrent booking attempts
- Timezone boundaries

The scheduling engine must have strong automated coverage.

---

# 75. E2E TESTS

Use Playwright for critical user journeys.

At minimum:

### Customer

```text
Visit shop
→ Browse service
→ Book appointment
→ Confirmation
```

### Reschedule

```text
Open appointment
→ Reschedule
→ Select new time
→ Confirm
```

### Cancellation

```text
Open appointment
→ Cancel
→ Confirm
```

### Admin

```text
Login
→ View appointment
→ Confirm
→ Complete
```

### Theme

```text
Open theme editor
→ Change theme
→ Save
→ Verify public site
```

### Tenant isolation

Verify Shop A cannot access Shop B's data.

---

# 76. CODE ORGANIZATION

Use a scalable project structure.

Keep:

- UI components
- domain/business logic
- database layer
- validation schemas
- server actions/API
- authentication
- tenant resolution
- scheduling engine
- notification system

properly separated.

Do not put all business logic inside React components.

The availability engine must be independently testable.

---

# 77. SERVER VS CLIENT

Prefer Server Components.

Use Client Components for:

- Interactive booking
- Calendar interaction
- Theme editor
- Modals/sheets
- Forms
- Animations
- Notification interactions
- Client-side preferences

Do not mark entire pages `"use client"` unnecessarily.

---

# 78. API / SERVER ACTION DESIGN

Use secure server-side interfaces.

All mutations must:

1. Validate input.
2. Resolve tenant.
3. Authenticate where required.
4. Authorize action.
5. Perform database operation.
6. Return safe data.

Never expose internal database objects unnecessarily.

---

# 79. SEO-SAFE PUBLIC ROUTING

Public shop pages should be crawlable.

Admin/private routes should not be indexed.

Customer appointment/private routes should not expose sensitive information to search engines.

Use proper metadata and robots rules.

---

# 80. CONTENT FALLBACKS

The site should never look broken because a shop has not filled every field.

For optional content:

```text
Missing hero image
→ Use elegant fallback

Missing testimonials
→ Hide section

Missing gallery
→ Hide section

Missing barber bio
→ Use clean minimal profile

Missing social links
→ Hide icons
```

Never show empty cards or placeholder text in production.

---

# 81. EMPTY STATES

Design intentional empty states.

Examples:

```text
No appointments today
No available appointments
No services
No barbers
No notifications
No customers
```

Every empty state should tell the user what to do next when appropriate.

---

# 82. LOADING STATES

Use:

- Skeletons
- Shimmer only where useful
- Progress indicators
- Optimistic UI where safe

Do not use giant generic spinners everywhere.

---

# 83. OFFLINE BEHAVIOR

If the user loses connectivity:

Display a clear message such as:

> You're offline. Booking requires an internet connection.

Previously loaded public information may remain accessible if cached.

Never pretend a booking succeeded while offline.

Never queue an appointment silently without a robust synchronization system.

---

# 84. SECURITY AGAINST BOOKING ABUSE

Protect public booking endpoints against:

- Spam
- Automated abuse
- Excessive requests
- Enumeration
- Fake appointment floods

Use appropriate:

- Rate limiting
- Request validation
- Bot protection where necessary
- Secure appointment lookup mechanisms

Do not overcomplicate the first implementation.

---

# 85. VISUAL QUALITY BAR

The final product must look intentionally designed.

Do not accept:

- Generic Tailwind defaults
- Generic shadcn demo pages
- Random colors
- Inconsistent spacing
- Poor typography
- Giant empty areas
- Cluttered dashboards
- Desktop-first mobile layouts
- Inconsistent border radii
- Unnecessary gradients
- Cheap-looking cards

Every screen should feel like part of the same product.

---

# 86. CUSTOMER EXPERIENCE QUALITY BAR

The customer should be able to understand:

```text
What is this shop?
↓
What can I book?
↓
How much does it cost?
↓
When can I come?
↓
How do I book?
```

within seconds.

Minimize friction.

Do not make customers create accounts unless absolutely necessary.

---

# 87. ADMIN EXPERIENCE QUALITY BAR

The barber should be able to answer immediately:

```text
Who is coming next?
Who booked today?
What times are free?
Who cancelled?
What do I need to do?
```

The dashboard should optimize for daily operational use rather than impressive analytics.

---

# 88. BRANDING

Every shop must be able to have a completely different identity.

Shop A:

```text
Classic black + gold
```

Shop B:

```text
White + red
```

Shop C:

```text
Green + cream
```

The same application architecture should support all of them.

Never assume one brand.

---

# 89. FUTURE EXTENSIBILITY

Do not implement these in the initial MVP unless explicitly required:

- Online payments
- Memberships
- Loyalty points
- Coupons
- Inventory
- Payroll
- Accounting
- Product sales
- Marketplace
- Reviews platform
- Multi-location enterprise management
- Subscription billing

However, the architecture should not make future implementation of these features unnecessarily difficult.

---

# 90. IMPORTANT PRODUCT PRINCIPLE

Do not over-engineer.

This is still fundamentally:

> **A barber booking application.**

The complexity should exist where it provides real value:

- Scheduling
- Tenant isolation
- Branding
- UX
- PWA
- Notifications
- Security
- SEO

Do not create abstractions merely to demonstrate technical sophistication.

---

# 91. DEVELOPMENT PROCESS

Before writing significant code:

1. Analyze the requirements.
2. Identify ambiguities.
3. Design the architecture.
4. Design the database schema.
5. Design tenant isolation.
6. Design the scheduling engine.
7. Design the theme system.
8. Design the routing structure.
9. Design the component system.
10. Define implementation phases.
11. Then implement incrementally.

Do not immediately generate hundreds of files.

Build the foundation first.

---

# 92. IMPLEMENTATION PHASES

Recommended implementation order:

## Phase 1 — Foundation

- Next.js setup
- TypeScript
- Tailwind
- UI primitives
- Database
- Drizzle
- Authentication
- Tenant model
- Core architecture

## Phase 2 — Theme/design system

- Design tokens
- Theme engine
- Theme presets
- Custom theme support
- Responsive primitives
- Animation system

## Phase 3 — Shop configuration

- Branding
- Business information
- Contact
- Location
- Settings

## Phase 4 — Services/barbers

- Service management
- Barber management
- Barber-service relationships

## Phase 5 — Scheduling engine

- Working hours
- Breaks
- Closures
- Availability
- Booking rules
- Conflict prevention

## Phase 6 — Customer experience

- Landing page
- Services
- Barbers
- Booking flow
- Confirmation
- Appointment lookup
- Cancellation
- Rescheduling

## Phase 7 — Admin

- Dashboard
- Calendar
- Appointments
- Customers
- Notifications
- Settings

## Phase 8 — Homepage customization

- Sections
- Ordering
- Content
- Images
- Visibility

## Phase 9 — PWA

- Manifest
- Service worker
- Installation
- Shortcuts
- Offline shell
- Push architecture

## Phase 10 — SEO/AEO/GEO

- Metadata
- Structured data
- Sitemap
- Robots
- Local business optimization
- FAQ
- Social metadata

## Phase 11 — Testing

- Unit
- Integration
- Scheduling engine
- Security
- E2E
- Tenant isolation

## Phase 12 — Performance/polish

- Core Web Vitals
- Bundle analysis
- Image optimization
- Accessibility
- Animation refinement
- Mobile polish

---

# 93. DO NOT

Do not:

- Hardcode shop information
- Hardcode brand names
- Hardcode contact details
- Hardcode opening hours
- Hardcode services
- Hardcode barbers
- Hardcode theme colors
- Put tenant-specific logic in frontend-only state
- Trust client-provided authorization data
- Trust client-provided prices/durations
- Rely solely on frontend availability
- Allow race-condition double booking
- Use browser alerts
- Make every component a Client Component
- Build a full CMS
- Build unnecessary enterprise features
- Use placeholder content in the final UI
- Create a generic SaaS-looking interface
- Overuse animations
- Sacrifice accessibility for aesthetics
- Sacrifice performance for animations
- Store generated time slots unnecessarily
- Expose private appointment data publicly

---

# 94. ACCEPTANCE CRITERIA

The application is not considered complete until:

### Multi-tenancy

- Multiple shops can exist.
- Shop data is isolated.
- Admins cannot access another shop's data.
- Public shop pages use dynamic tenant data.

### Branding

- Shop name can be changed without code changes.
- Contact information can be changed without code changes.
- Logo can be changed without code changes.
- Theme can be changed without code changes.
- Custom themes work.

### Booking

- Customers can book.
- Customers can select services.
- Customers can select barbers.
- Customers can choose "Any available barber".
- Availability is calculated correctly.
- Double booking is prevented.
- Service duration is respected.
- Buffers are respected.
- Breaks are respected.
- Closures are respected.
- Working hours are respected.
- Booking limits are respected.

### Admin

- Admin can manage appointments.
- Admin can manage services.
- Admin can manage barbers.
- Admin can configure schedules.
- Admin can manage closures.
- Admin can configure branding.
- Admin can configure theme.
- Admin can configure homepage.
- Admin can view customers.

### PWA

- App is installable.
- Android experience is polished.
- iOS experience is polished.
- Shortcuts work where supported.
- Offline shell works.
- Booking never falsely succeeds offline.

### SEO

- Dynamic metadata works per shop.
- Sitemap works.
- Robots configuration works.
- Structured data is valid.
- Public pages are crawlable.
- Private pages are protected from indexing.

### UX

- Mobile experience is excellent.
- Desktop experience is excellent.
- Accessibility is respected.
- Loading states exist.
- Empty states exist.
- Error states exist.
- Animations respect reduced motion.

### Code quality

- TypeScript strict mode passes.
- Lint passes.
- Tests pass.
- Production build passes.
- No obvious console errors.
- No critical security issues.
- No unnecessary hardcoded business data.

---

# 95. FINAL QUALITY REQUIREMENT

Do not stop at "functional."

The final application should feel like a product that a real barber shop could proudly put on its business card.

The customer-facing experience should be:

**beautiful + fast + effortless**

The barber/admin experience should be:

**simple + practical + reliable**

The underlying engineering should be:

**secure + scalable + maintainable + testable**

The architecture should allow:

```text
One platform
     ↓
Many barber shops
     ↓
Each with its own
branding
theme
content
services
barbers
schedule
customers
appointments
settings
```

without modifying application source code.

The application should be designed as a reusable product from the beginning while keeping the actual feature set intentionally focused.

Build the system with the mindset:

> **Premium consumer UX on the outside. Serious engineering underneath.**

Important
donot use em dashes , long dashes or emojis , create a tracker file and update it on each phase, create proper docs, readme files and all the files a professional github repo has, developer info at "C:\Users\arunn\Desktop\ARUN-PROFILE.md"

donot create an ai slop , use proper wordings, images from internet, icons, favicons, and all other images, use impeccable and ui ux pro skills. micro interactions is mandatory, haptics, sounds and other quality ux stuff.

accessibility, code quality, best coding practices, reusability, modularity.

read the file and understand the project, we dont have to go multi tenant for now, but we need our system to be easily updatable for another shop so yeah read the file and be ready. you will work by creating implementation plan and a tracker file first and keep updating tracker file according to the things we build. i want an ios hig feel in our app.
