# Grooma

> Your grooming, made simple.

A production-grade appointment booking and shop management platform for barber shops. Customers book services in seconds from their phone. Owners run the day from a focused admin dashboard. Built to serve one shop today with a tenant-aware core that scales to many shops tomorrow.

## Features

**Customer**

- Guest-first booking, no account required: service, barber or any available, date, time, details
- Real-time availability computed server side from working hours, breaks, closures, and booking rules
- Secure appointment lookup link for viewing, rescheduling, and cancelling
- Add to calendar, call, WhatsApp, and directions actions

**Shop owner**

- Dashboard built around daily operations: who is next, what is free, what needs attention
- Calendar views: today, day timeline, week overview, mobile list
- Appointment lifecycle management: confirm, complete, cancel, no-show, reschedule, notes
- Managers for services, barbers, schedules, breaks, closures, and booking rules
- Theme presets and homepage customization, all data driven, zero code changes

**Platform**

- Double-booking prevention enforced by a Postgres exclusion constraint plus transactional recheck
- Historical price and duration snapshots on every appointment
- Explicit timezone handling, default Asia/Kathmandu, configurable per shop
- PWA install support, offline shell, iOS safe area handling
- SEO with per-shop metadata, structured data, sitemap, robots

See `docs/IMPLEMENTATION_PLAN.md` for the full architecture and `TRACKER.md` for live build status.

## Tech stack

| Layer      | Technology                                           |
| ---------- | ---------------------------------------------------- |
| Framework  | Next.js 16, React 19, App Router                     |
| Language   | TypeScript, strict mode                              |
| Styling    | Tailwind CSS v4, semantic design tokens              |
| UI         | shadcn/ui patterns on Radix primitives, Lucide icons |
| Animation  | Motion for React                                     |
| Database   | PostgreSQL via Drizzle ORM                           |
| Validation | Zod                                                  |
| Forms      | React Hook Form + Zod                                |
| Auth       | Better Auth                                          |
| Dates      | date-fns, @date-fns/tz                               |
| Email      | Resend behind a provider abstraction                 |
| PWA        | Serwist                                              |
| Testing    | Vitest, Playwright                                   |
| Quality    | ESLint, Prettier, GitHub Actions                     |

## Getting started

Prerequisites: Node.js 20+ and pnpm 10. Docker is needed for local Postgres from Phase 1 onward.

This project uses pnpm exclusively. Do not run `npm install` or `yarn install`; it creates lockfile drift that CI will reject.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000.

Database setup arrives with Phase 1:

```bash
docker compose up -d        # local Postgres
pnpm db:migrate             # apply Drizzle migrations
pnpm db:seed                # demo shop, services, barbers, appointments
```

## Scripts

| Command             | What it does                  |
| ------------------- | ----------------------------- |
| `pnpm dev`          | Development server            |
| `pnpm build`        | Production build              |
| `pnpm start`        | Serve production build        |
| `pnpm lint`         | ESLint                        |
| `pnpm typecheck`    | TypeScript strict check       |
| `pnpm test`         | Run Vitest suite              |
| `pnpm format`       | Format with Prettier          |
| `pnpm format:check` | Verify formatting in CI style |

## Project structure

```text
src/
├── app/            routes: public, admin, auth, api
├── components/     ui primitives, booking, public, admin
├── lib/            scheduling engine, notifications, theme, utils
├── db/             schema, migrations, repositories, seed
├── actions/        server actions
└── config/         constants and navigation
```

## Testing

Scheduling correctness is the heart of this system, so the availability engine is pure code under exhaustive unit tests. Critical journeys (booking, rescheduling, cancellation, admin lifecycle) get Playwright end-to-end coverage.

```bash
pnpm test
```

## Deployment

Designed for Vercel with managed Postgres such as Neon. Set the environment variables from `.env.example` in the hosting provider. CI validates lint, types, tests, and build on every pull request.

## Roadmap

Implementation follows phased delivery documented in `docs/IMPLEMENTATION_PLAN.md`. Progress lives in `TRACKER.md`.

## Author

Built by [Arun Neupane](https://arunneupane.vercel.app), CTO at Sajilo Digital Pvt. Ltd., Butwal, Nepal.

- GitHub: [@arundada9000](https://github.com/arundada9000)
- LinkedIn: [in/arundada9000](https://www.linkedin.com/in/arundada9000)
- Email: arunneupane0000@gmail.com

## License

Proprietary. Copyright 2026 Arun Neupane. All rights reserved. See `LICENSE`.
