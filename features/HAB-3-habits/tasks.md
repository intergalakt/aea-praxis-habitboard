# HAB-3 — Tasks

Ein Arbeitspaket = ein Commit-Häppchen. **Level 0** ist lauffähig ohne neue Konfiguration, ohne
Env-Variablen und ohne laufende Datenbank — reine Logik und Tests. Jede Task nennt am Ende ihr
Abnahmekriterium (AC = Acceptance Criterion aus `spec.md`).

## Level 0 — Grundlagen ohne Konfiguration

- [ ] **T1 — Validierungsschema** (`src/features/habits/habit.schema.ts`): `habitTitleSchema`
  (Trim, 1–80, nicht nur Leerzeichen), `habitIdSchema` (UUID), `habitInputSchema`.
  Tests: `habit.schema.test.ts` (gültig, leer, nur Spaces, 80/81 Zeichen, Emoji).
  **AC-1, AC-9, EC-5**

- [ ] **T2 — Serienlogik** (`src/features/habits/habit.rules.ts`): `calculateStreak(dates, today)`
  und `summarizeToday(habits, today)` rein, ohne `new Date()`-Zugriff in der Funktion.
  Tests: heute erledigt, gestern erledigt, Lücke, zwei Lücken, leerer Verlauf, Duplikate,
  Monats-/Jahreswechsel, Schaltjahr.
  **AC-4, AC-5, EC-2**

- [ ] **T3 — Level-0-Abschluss:** `npx vitest run` grün, `npm run check` grün (Lint, Typen,
  Architektur, Build) — ohne Datenbank und ohne Env-Änderung.

## Level 1 — Datenbank

- [ ] **T4 — Migration** (`supabase/migrations/<ts>_habits.sql`): `habits` + `habit_entries` mit
  FKs, `unique (habit_id, entry_date)`, `on delete cascade`, Check auf `entry_date <= current_date`,
  Indizes auf `user_id` bzw. `(habit_id, entry_date)`.
  **AC-3, AC-6, AC-9**

- [ ] **T5 — RLS-Policies:** `alter table … enable row level security` und je vier Policies
  (select/insert/update/delete) mit `user_id = auth.uid()`; idempotent (`drop policy if exists`).
  Nachweis: zweiter Nutzer sieht 0 Zeilen, Löschversuch ändert nichts.
  **AC-8**

## Level 2 — Anwendungsschicht

- [ ] **T6 — Repository** (`habit.repository.ts`, `server-only`): `listForUser`, `create`,
  `toggleToday`, `untoggleToday`, `remove`; Fehler werden in `{ ok: false }` übersetzt.
  **AC-2, AC-4, AC-6, EC-4**

- [ ] **T7 — Server Actions** (`habit.actions.ts`): `createHabit`, `toggleHabit`, `deleteHabit`;
  jede prüft `getSessionUser()`, validiert mit Zod, ruft `revalidatePath('/dashboard')`.
  **AC-1, AC-2, AC-6, AC-10**

## Level 3 — Oberfläche

- [ ] **T8 — Board-Komponenten:** `habit-board.tsx` (Server Component, lädt + rechnet),
  `habit-form.tsx`, `habit-row.tsx` (Serie, Abhaken/Zurücknehmen, Löschen mit Rückfrage),
  `habit-progress.tsx`, Leerzustand.
  **AC-1, AC-2, AC-4, AC-5, AC-6, AC-7, EC-1, EC-5**

- [ ] **T9 — Einbindung:** `src/app/(protected)/dashboard/page.tsx` ersetzt den Platzhalter
  („Gewohnheiten … kommen mit HAB-3“) durch `<HabitBoard />`; deutsche Texte durchgängig.
  **AC-7, AC-10**

## Level 4 — Nachweis

- [ ] **T10 — Unit-Tests vollständig:** `npx vitest run` grün, alle Fälle aus T1/T2 abgedeckt.

- [ ] **T11 — E2E** (`tests/hab-3-habits.spec.ts`): Registrieren → Anlegen → Abhaken →
  Zurücknehmen → Serie sichtbar → Löschen → Leerzustand; zweiter Kontext (fremder Nutzer) sieht
  die Gewohnheit nicht.
  **AC-1 – AC-8, AC-10**

- [ ] **T12 — QA-Bericht** (`features/HAB-3-habits/qa-report.md`) nach QA-Template, inkl.
  Live-Prüfung und RLS-Nachweis mit zwei Konten.

- [ ] **T13 — Index & Commit:** `features/INDEX.md` auf „Approved“; Commits je Level.
