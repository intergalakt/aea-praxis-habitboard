# HAB-3 — Tasks

Ein Arbeitspaket = ein Commit-Häppchen. **Level 0** ist lauffähig ohne neue Konfiguration, ohne
Env-Variablen und ohne laufende Datenbank — reine Logik und Tests. Jede Task nennt am Ende ihr
Abnahmekriterium (AC = Acceptance Criterion aus `spec.md`).

## Level 0 — Grundlagen ohne Konfiguration

- [x] **T1 — Validierungsschema** (`src/features/habits/habit.schema.ts`): `habitTitleSchema`
  (Trim, 1–80 in Code Points, nicht nur Leerzeichen), `habitIdSchema` (UUID), `habitInputSchema`.
  Tests: `habit.schema.test.ts` (gültig, leer, nur Spaces, 80/81 Zeichen, Emoji).
  **AC-1, AC-9, EC-5**

- [x] **T2 — Serienlogik** (`src/features/habits/habit.rules.ts`): `calculateStreak(dates, today)`
  und `summarizeToday(habits, today)` rein, ohne `new Date()`-Zugriff in der Funktion.
  Tests: `habit.rules.test.ts` (heute erledigt, gestern erledigt, Lücke, zwei Lücken, leerer
  Verlauf, Duplikate, Monats-/Jahreswechsel, Schaltjahr).
  **AC-4, AC-5, EC-2**

- [x] **T3 — Level-0-Abschluss:** `npx vitest run src/features/habits` grün, ohne Datenbank und
  ohne Env-Änderung. Commit `feat(HAB-3): Validierung und Serienlogik mit Tests`.

## Level 1 — Datenbank

- [x] **T4 — Migration** (`supabase/migrations/20261102120000_habits.sql`): `habits` +
  `habit_entries` mit FKs, `unique (habit_id, entry_date)`, `on delete cascade`, Check auf
  `char_length(btrim(title)) between 1 and 80` und `entry_date <= current_date`, Indizes auf
  `user_id` bzw. `(habit_id, entry_date)`.
  **AC-3, AC-6, AC-9**

- [x] **T5 — RLS-Policies:** `alter table … enable row level security` und je vier Policies
  (select/insert/update/delete) mit `user_id = auth.uid()`; idempotent (`drop policy if exists`).
  Nachweis erbracht: zweiter Nutzer sieht 0 Zeilen, fremder Insert 403, fremdes Delete ohne
  Wirkung. Commit `feat(HAB-3): Migration fuer habits und habit_entries mit RLS`.
  **AC-8**

## Level 2 — Anwendungsschicht

- [x] **T6 — Repository** (`habit.repository.ts`, `server-only`): `listForUser`, `create`,
  `addEntry`, `removeEntry`, `remove`; Fehler werden in `{ ok: false }` übersetzt.
  Commit `feat(HAB-3): Repository und Server Actions`.
  **AC-2, AC-4, AC-6, EC-4**

- [x] **T7 — Server Actions** (`habit.actions.ts`): `createHabitAction`, `toggleHabitAction`,
  `deleteHabitAction`; jede prüft `getSessionUser()`, validiert mit Zod, ruft
  `revalidatePath('/dashboard')` und meldet Fehler über `?fehler=<code>` zurück.
  **AC-1, AC-2, AC-6, AC-10**

## Level 3 — Oberfläche

- [x] **T8 — Board-Komponenten:** `habit-form.tsx`, `habit-list.tsx` (Fortschritt, Leerzustand),
  `habit-item.tsx` (Serie, Abhaken/Zurücknehmen, Löschen) — alle Server Components ohne
  Client-State. Commit `feat(HAB-3): Board-Oberflaeche mit Formular, Liste und Fortschritt`.
  **AC-1, AC-2, AC-4, AC-5, AC-6, AC-7, EC-1, EC-5**

- [x] **T9 — Einbindung:** `src/app/(protected)/dashboard/page.tsx` lädt über `listForUser`,
  zeigt Fortschritt und Fehlermeldungen, deutsche Texte durchgängig.
  **AC-7, AC-10**

## Level 4 — Nachweis

- [x] **T10 — Unit-Tests vollständig:** `npx vitest run` → 79 Tests in 9 Dateien grün.

- [x] **T11 — E2E** (`tests/hab-3-habits.spec.ts`): Registrieren → Anlegen → Abhaken →
  Zurücknehmen → Serie sichtbar → Löschen → Leerzustand → ohne JavaScript; zweiter Kontext
  (fremder Nutzer) sieht die Gewohnheit nicht. 7 Tests, Chromium und Mobile Safari grün.
  Commit `test(HAB-3): E2E-Suite fuer Board, Serien, Loeschen und Fremdzugriff`.
  **AC-1 – AC-8, AC-10**

- [x] **T12 — QA-Bericht** (`features/HAB-3-habits/qa-report.md`) nach QA-Template, inkl.
  Live-Prüfung und RLS-Nachweis mit zwei Konten.

- [x] **T13 — Index & Commit:** `features/INDEX.md` auf „Approved“; Commits je Level.
