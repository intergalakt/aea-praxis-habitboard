# HabitBoard

Gewohnheiten-SaaS: eigene Gewohnheiten anlegen, jeden Tag abhaken, die aktuelle Serie sehen.
Dazu eine öffentliche Wetterseite mit aktuellen Daten von Open-Meteo. Konten, Daten und RLS
basieren auf Supabase; die Oberfläche läuft auf Next.js 16 (App Router).

---

## Stack

| Baustein | Version / Wahl |
|---|---|
| Framework | Next.js 16, React 19, App Router, TypeScript strict |
| Datenbank & Auth | Supabase (Postgres, GoTrue, Row Level Security), lokal via CLI |
| UI | Tailwind CSS v4, shadcn/ui-Komponenten |
| Validierung | Zod, serverseitig in jeder Server Action |
| Tests | Vitest (Unit), Playwright (E2E: Chromium + Mobile Safari) |
| Architektur-Guards | dependency-cruiser + `scripts/check-architecture.mjs` |
| Scaffold | AI Engineering Kit `create-ai-eng-app` 0.7.7 |

---

## Setup

Voraussetzungen: Node 24, npm 11, Docker (für Supabase lokal), Supabase CLI über `npx`.

```bash
npm install                       # Abhängigkeiten
cp .env.local.example .env.local  # Werte aus `npx supabase status` eintragen
npx supabase start                # Postgres, Auth, Studio auf 127.0.0.1:54321
npx supabase migration up --local # Tabellen, Policies, Constraints
npm run dev                       # http://localhost:3000
```

`.env.local` enthält ausschließlich die lokalen Testwerte (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`). Echte Zugangsdaten gehören nicht ins Repo; die Datei ist
per `.gitignore` und per `permissions.deny` in `.claude/settings.json` geschützt.
Der `service_role`-Key wird von der App nicht verwendet.

---

## Features

| ID | Feature | Beschreibung | Doku |
|---|---|---|---|
| HAB-1 | Konten & Login | Registrierung, Anmeldung, geschützter Bereich, Abmelden, Rate-Limit, Passwortrichtlinie | [features/HAB-1-auth/](features/HAB-1-auth/) |
| HAB-2 | Wetter-Integration | Öffentliche Seite `/wetter`: aktuelles Wetter und Tagesvorhersage je Ort, ohne API-Schlüssel, mit Quellenangabe nach CC BY 4.0 | [features/HAB-2-wetter/](features/HAB-2-wetter/) |
| HAB-3 | Habit-Tracker | Board mit eigenen Gewohnheiten, Tagesabhaken, Serie, Fortschritt, Löschen — ausschließlich eigene Daten | [features/HAB-3-habits/](features/HAB-3-habits/) |

Jedes Feature-Verzeichnis enthält `spec.md` (Anforderungen mit Acceptance Criteria),
`design.md` (Tech-Design), `tasks.md` (Arbeitspakete in Level-Struktur) und `qa-report.md`
(Testprotokoll). Die Übersicht steht in [features/INDEX.md](features/INDEX.md).

---

## Architektur

```
src/
├── app/                    Routen (App Router)
│   ├── (auth)/             /login, /signup — öffentlich
│   ├── (protected)/        /dashboard — nur mit Session
│   └── wetter/             öffentliche Wetterseite
├── features/
│   ├── auth/               Schema, Regeln, Throttle, Actions, Hooks
│   ├── habits/             Schema, Regeln, Repository, Actions, Komponenten
│   └── weather/            Schema, Regeln, Cache, Client, Service, Komponenten
├── components/ui/          shadcn-Basis
└── lib/supabase/           Browser- und Server-Client
```

Drei Regeln, die der Build maschinell prüft (`npm run check:structure`):

1. **Schichtung.** `*.schema.ts` und `*.rules.ts` sind reine Funktionen ohne IO, ohne
   `new Date()` und ohne Netz. Alles, was Datenbank oder HTTP spricht, liegt darüber und ist
   mit `server-only` markiert — ein versehentlicher Import im Client bricht den Build.
2. **Ein Feature pro Verzeichnis.** UI, Regeln und Datenzugriff eines Features bleiben in
   `src/features/<name>/`; geteilte Bausteine liegen in `src/components` oder `src/lib`.
3. **Autorisierung doppelt.** Jede geschützte Seite prüft die Session selbst, und jede Tabelle
   trägt RLS-Policies auf `user_id = auth.uid()`. Kein Code vertraut dem Proxy allein.

Datenmodell und ER-Diagramm: [docs/data-model.md](docs/data-model.md).

---

## Tests und Prüfungen

```bash
npm run check      # Lint, Typecheck, Architektur, Unit-Tests, Build
npm test           # Vitest: 79 Tests in 9 Dateien
npm run test:e2e   # Playwright: 44 Läufe (22 Tests × Chromium/Mobile Safari)
```

Stand 2026-11-02: `npm run check` Exit 0, Vitest 79/79 grün, Playwright 44/44 grün.
Die QA-Berichte halten fest, was geprüft wurde und was bewusst offen blieb.

---

## Dokumentation

| Datei | Inhalt |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Produktanforderungen, Zielgruppe, Umfang |
| [docs/data-model.md](docs/data-model.md) | Tabellen, Beziehungen, RLS, ER-Diagramm |
| [docs/app-shell.md](docs/app-shell.md) | Layout, Navigation, Routen |
| [docs/bericht.md](docs/bericht.md) | Arbeitsbericht: Vorgehen, Entscheidungen, Fehler |
| [docs/blockiert.md](docs/blockiert.md) | Blockierte Punkte und ihr Status |
| [docs/tech-debt.md](docs/tech-debt.md) | Bekannte technische Schulden |
| [CLAUDE.md](CLAUDE.md) | Arbeitsregeln für den Coding-Agenten |

---

## Arbeitsweise

Das Projekt folgt dem Spec-First-Workflow des Kits: Spec → Design → Tasks → Build → QA.
Jeder Schritt ist ein eigener Commit in Conventional-Commit-Form (`docs(HAB-3): …`,
`feat(HAB-3): …`, `test(HAB-3): …`), sodass die Git-Historie den Weg von der Anforderung
zum getesteten Code nachzeichnet. Die Skills dafür liegen in `.claude/skills/`.
