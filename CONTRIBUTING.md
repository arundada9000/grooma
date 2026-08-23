# Contributing to Barber Appointment System

Thanks for your interest in improving this project. This document covers how to set up the project locally and the conventions every change is expected to follow.

## Getting started

1. Install Node.js 20 or newer and pnpm 10.
2. `pnpm install`
3. `cp .env.example .env.local` and fill in the values you need.
4. `pnpm dev` and open http://localhost:3000

This project uses pnpm exclusively. Never run `npm install` or `yarn install`; doing so rewrites the lockfile and breaks reproducible installs.

Useful commands:

| Command           | What it does                 |
| ----------------- | ---------------------------- |
| `pnpm dev`        | Start the development server |
| `pnpm build`      | Production build             |
| `pnpm lint`       | ESLint                       |
| `pnpm typecheck`  | TypeScript, strict mode      |
| `pnpm test`       | Vitest suite once            |
| `pnpm test:watch` | Vitest in watch mode         |
| `pnpm format`     | Prettier write               |

Before opening a pull request, run lint, typecheck, and tests. CI runs all three plus a production build on every PR.

## Branch naming

| Prefix   | Use for               |
| -------- | --------------------- |
| `feat/`  | New features          |
| `fix/`   | Bug fixes             |
| `chore/` | Tooling, deps, config |
| `docs/`  | Documentation only    |

Example: `feat/booking-flow`

## Commit convention

Conventional Commits. The type goes first, the scope is optional, the subject is lowercase and imperative.

```text
feat(booking): add time slot picker
fix(scheduling): handle midnight boundary in slot generation
chore: bump next to 16.3.2
docs: document seeding steps
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`, `ci`, `build`.

## Code conventions

- TypeScript strict mode. No `any`. No non-null assertions unless justified in a comment.
- Server Components by default. Add `"use client"` only where interactivity requires it.
- Style through semantic design tokens and Tailwind utilities. No raw hex values inside components.
- Business logic lives outside React components. Scheduling math stays pure and tested.
- All data access goes through shop-scoped repository functions. Never query tenant tables without an explicit `shopId`.
- Validate every external input with Zod at the server boundary.
- Accessibility is not optional: semantic HTML, labeled controls, visible focus, keyboard paths.

## Pull requests

1. Keep PRs focused. One feature or fix per PR.
2. Describe what changed and why. Link related issues.
3. Include tests for anything touching scheduling, booking, or money.
4. Update `TRACKER.md` if the change completes tracked work.
5. Screenshots for UI changes, both light and dark where relevant.

## Reporting bugs

Open an issue using the bug report template. Include reproduction steps, expected behavior, and environment details.

## License

By contributing, you agree that your contributions are licensed under the project license in `LICENSE`.
