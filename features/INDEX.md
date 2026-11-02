# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Roadmap** - `/init` done, feature identified in feature map, no spec file yet
- **Mapped** - already built before the kit arrived; proposed by `/map`, confirmed at `/init`, no spec folder yet — `/reverse-spec` writes it
- **Spec'd** - `/reverse-spec` done: runs in production, criteria confirmed, not yet verified — `/qa` closes that gap
- **Planned** - `/write-spec` done, full spec written, architecture not yet designed
- **Architected** - `/architecture` done, tech design approved, ready to build
- **Tasked** - `/tasks` done, tasks.md approved, ready to build
- **In Progress** - `/build` active or completed, not yet in QA
- **In Review** - `/qa` active, testing in progress
- **Approved** - `/qa` passed, no critical/high bugs, ready to deploy
- **Deployed** - `/deploy` done, live in production
- **Merged** - spec folded into another feature by `/refine`; the Spec cell names it, the folder lies in `features/archive/`

## Features

> The **Spec** column links to the feature **folder** (`features/HAB-X-name/`), not a single file. Each folder contains `spec.md`, `design.md`, `tasks.md`, and `qa-report.md`.

| ID | Feature | Description | Status | Spec | Created |
|----|---------|-------------|--------|------|---------|
| HAB-1 | Konten & Login | Registrierung und Anmeldung per E-Mail und Passwort, geschützter Bereich und die Row-Level-Security-Grundlage der App. | Approved | [features/HAB-1-auth/](features/HAB-1-auth/) | 2026-11-02 |
| HAB-2 | Wetter-Integration | Öffentliche Open-Meteo-Abfrage: aktuelles Wetter und Tagesvorhersage für einen gewählten Ort, ohne Schlüssel. | Roadmap | [features/HAB-2-wetter/](features/HAB-2-wetter/) | 2026-11-02 |
| HAB-3 | Habit-Tracker | Eigene Gewohnheiten anlegen, täglich abhaken, aktuelle Serie sehen — nur für den angemeldeten Nutzer. | Roadmap | [features/HAB-3-habits/](features/HAB-3-habits/) | 2026-11-02 |

**Build order:** P0 (MVP): HAB-1 → HAB-2 → HAB-3

<!-- Add features above this line -->

## Deployments

- _noch kein Deployment — `/deploy` ist nicht Teil dieser Prüfungsleistung_

## Next Available ID: HAB-4
