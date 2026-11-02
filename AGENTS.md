# aea-praxis

> Built with the AI Engineering Kit — a spec-driven workflow for your coding agent.

<!-- AI-ENG-KIT:START (managed — do not edit by hand; refreshed by /verify-setup) -->
## AI Engineering Workflow

`/init → /write-spec → /architecture → /tasks → /build → /qa → /deploy`

Feature artifacts: `features/PROJ-X-name/{spec,design,tasks,qa-report}.md`.
Use `/refine` for changes, `/audit` for drift, `/dsgvo` for personal data, `/e2e-tests` for critical
journeys, `/security-check` and `/cleanup` after release. Phase details live in the skills;
specialist guidance in `docs/kit/guides/` and matching `docs/stacks/` packs is read on demand.

# General Project Rules

## Working Language
Use the language in the canonical memory file → Key Conventions and `.ai-eng-kit` → `language`
for replies and generated documents, including headings and ACs. Code, paths, commits and
kit-authored files stay English. Explicit user overrides win; never bulk-translate old documents.
If the language is unrecorded, ask once.

## Start and route
Read `.ai-eng-kit` and `features/INDEX.md`. An unfilled PRD/empty feature map needs `/init` before
implementation (`mode: existing`: `/map` then `/init`). Use `/write-spec` for independent new
capabilities, `/refine` for an existing feature's changes/extensions, `/build` then scoped `/qa`
for bugs against its contract. Behavior-neutral fixes may be direct. Follow skill checkpoints;
handoffs to the next phase need the user's confirmation, including authorization already given.

## Layers
Existing code/tooling wins. Read the owning layer's `packs` before stack packs; use its `root`,
`commands` and `probe`. Otherwise use the primary registry values. Null means unknown: propose
from files, then `/init` confirms; never invent a stack or skip an unknown check. All `PROJ-`
examples mean `.ai-eng-kit` → `featurePrefix` (default `PROJ`). Stay on the user's feature branch;
only `/deploy` merges/removes branches, with approval.

## Contracts and tracking
Keep AC → Task → Test intact; `spec.md` is read-only during `/build`. INDEX is the sole status
record: change only the Status cell; a new row gets name, one sentence and link. Notes/decisions
belong in `design.md`, QA findings in `qa-report.md`, internal work in `docs/tech-debt.md`.
Read files before editing, write actual tracking updates, then re-read to verify them.

## Test Runs
Full suites: build's main agent once per completed level and at closing; QA's owner once per
runtime before lanes. Tasks, fixes, lanes and red proofs run single files. Read
`docs/kit/guides/checks.md` only at build/deploy closing; an aggregate is never an inner-loop test.
QA verification uses a fresh context; its own skill defines re-verification and Deferred bugs.
# Security Rules

- **SEC-01 Secrets:** never read/write real env or credential files, expose keys in code/logs,
  commit them, or bypass a denial. Edit only dummy examples; tell the user where to enter real values.
- **SEC-02 Trust:** validate external input at its trusted entry point; model output is untrusted.
- **SEC-03 Access:** enforce identity and ownership where protected operations/data are accessed.
- **SEC-08 Verification:** never weaken checks, suppressions or baselines to reach green; show a
  legitimate check change for review. Auth/access changes require explicit user approval; existing
  approval for that exact change suffices. Record exceptions, never silently waive a control.

Before designing, building, testing or releasing affected code, select the applicable sections in
`docs/kit/guides/security.md` using the registry's platform/stack, **each affected layer** and the
actual feature. Load auth guidance whenever real credentials are checked, including native apps;
HTTP/browser guidance only for the runtime that serves them. Unknown is not absent; clarify it.
A missing stack pack changes the mechanism, never the security requirement.
<!-- AI-ENG-KIT:END -->

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (copy-paste components)
- **Backend:** Supabase (PostgreSQL + Auth + Storage) - optional
- **Deployment:** Vercel or Hostinger (GitHub-connected auto-deploy)
- **Validation:** Zod + react-hook-form
- **State:** React useState / Context API

## Project Structure

```
src/
  app/              Pages (Next.js App Router)
  features/         Feature implementation: UI, rules, data and integrations together
  components/
    ui/             shadcn/ui components (NEVER recreate these)
  hooks/            Custom React hooks
  lib/              Named shared infrastructure (supabase/) and small shared utilities
supabase/           Created by `supabase init` in /init when the backend is Supabase
  migrations/       Schema changes as .sql files (one per change)
tests/              Playwright E2E tests (added by /e2e-tests)
features/           Feature specs, one folder per feature
  PROJ-X-name/      spec.md, design.md, tasks.md, qa-report.md
  INDEX.md          Feature status overview
docs/
  PRD.md            Product Requirements Document
  data-model.md     App-wide data model (entities + relationships); built by /init, refined by /architecture
  app-shell.md      App-wide frame (navigation, layout regions, page pattern); built by /init, refined by /architecture
  privacy.md        What personal data the product processes, why, how long; kept current by /dsgvo
  tech-debt.md      Internal work with a status (refactorings, coverage, cleanup); fed by /map, worked by /refactor
  kit/CHANGELOG.md  The AI Engineering Kit's own release history. Kit-authored; replaced on update.
  kit/guides/      On-demand security, design and closing-check guidance; never auto-imported
  production/       Topic guides: error tracking, security headers, rate limiting, performance, DB
  stacks/           Stack packs — the concrete procedures for this project's stack, read by the
                    skills when they need a command or a path. Kit-authored; replaced on update.
```

## Key Conventions

- **Code structure and checks:** Follow the Next.js pack's feature/module convention. `npm run check`
  is the final build check; targeted tests remain the inner loop. See `docs/stacks/framework-nextjs.md`.

- **Working language: Deutsch.** Talk to the user in Deutsch and write every project document in Deutsch — see `AGENTS.md` → Working Language.
- **Feature IDs:** PROJ-1, PROJ-2, etc. (sequential)
- **Commits:** `feat(PROJ-X): description`, `fix(PROJ-X): description`
- **Single Responsibility:** One feature per folder
- **Feature branches:** you create a branch `feat/PROJ-X-name` before `/build`; work stays there through build/QA/E2E, and `/deploy` merges it into `main` to go live. `main` always stays deployable.
- **shadcn/ui first:** NEVER create custom versions of installed shadcn components
- **App shell:** navigation, layout regions, and the page pattern live in `docs/app-shell.md` and belong to the feature recorded there. Reuse those components — never add a second sidebar, header, or nav inside a feature. Changing how the shell behaves is a `/refine` on its owning feature.
- **Parallel build:** `/build` runs file-disjoint [P] tasks from `tasks.md` as isolated subagents
- **Human-in-the-loop:** All workflows have user approval checkpoints
- **Secrets / env files:** Never read/write `.env.local` or other real credential files. Document
  variable names with dummy values in `.env.local.example`; tell the user where to obtain and
  privately enter real values.
- **Tests:** Unit tests co-located next to source files (`useHook.test.ts` next to `useHook.ts`), written by `/qa`. E2E tests live in `tests/`, added on demand by `/e2e-tests` for critical core journeys only.
- **Supabase environments:** The test-vs-live strategy (`local` / `two-projects` / `single` / `branching`) is chosen at `/init` and recorded in `docs/PRD.md` → Constraints. Default is **`local`** — Supabase runs in Docker while you build, then migrates to a hosted live project at `/deploy` (`supabase db push`). `.env.local` always holds **test** keys, never live. Schema changes are captured as `supabase/migrations/*.sql` and promoted to production at `/deploy`.

## Build & Test Commands

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run start        # Production server
npm test             # Vitest unit/integration tests
npm run test:e2e     # Playwright E2E tests
npm run test:all     # Both test suites
```

## Product Context

@docs/PRD.md

## Data Model

@docs/data-model.md

## Feature Overview

@features/INDEX.md
