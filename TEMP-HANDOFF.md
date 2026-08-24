# TEMP HANDOFF — delete this file after reading

You are picking up Grooma (barber appointment system) in
`D:\Programming\nextjs\barber-appointment-system`. Read `TRACKER.md` first:
it is the single source of truth (board, AD decision log, changelog through
session 17). `AGENTS.md` points at the Next.js docs in node_modules — this
Next version has breaking changes, check there before writing code.

## State

- Branch `main`, clean tree, all work committed. Latest commits: Phase 9 admin
  ops (`6eff9e7`), Phase 10 shop config (`96ca5db`), Phase 11 theme/homepage
  admin (`a05accd`), contrast validation (`f47abbe`).
- Done: phases 1–10 complete; Phase 11 done except the homepage section
  content model (images, per-locale section content).
- Next task: design + build that content model. Then Phase 12 notifications —
  blocked on the user providing a RESEND_API_KEY.
- Dev server runs on :3000 (log at `$env:TEMP\opencode\grooma-dev.log`).

## Rules of the house (violating these cost time before)

- Never run `pnpm build` while the dev server is up (pollutes `.next`).
- PowerShell: no `rg`; use `-LiteralPath` for `[locale]` paths; backtick
  template literals break inside `node -e` — write temp `.cjs` scripts to
  `$env:TEMP\opencode` instead.
- Lint enforces react-hooks/purity: no `Date.now()` in component bodies — use
  `currentInstantMs()` from `src/lib/scheduling/format.ts`. No synchronous
  setState in effects (cache by signature instead).
- Typed dictionary keys: template literals only compile when interpolating a
  closed union. `ne.ts` is DeepPartial with English fallback.
- Every mutation goes through a zod-validated `"use server"` action returning
  discriminated unions; requireOwner() is the admin boundary.
- Do NOT commit `.impeccable/` (now gitignored) or `.claude/`, `.opencode/`.
- Checks before any commit: `pnpm format lint typecheck test` (95 tests today).
- User prefers speed: verify live against the dev server with PowerShell
  `Invoke-WebRequest` + sign-in cookie via `/api/auth/sign-in/email`
  (`owner@democlassic.test` / `GroomaDev123!`), keep verification tight.

Delete this file in your first commit once you have context.
