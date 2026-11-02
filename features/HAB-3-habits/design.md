# HAB-3 — Tech Design

Spec: `features/HAB-3-habits/spec.md` · Data Model: `docs/data-model.md` · Stack: Next.js 16
(App Router, Server Components + Server Actions), Supabase (Postgres + RLS) · Arbeitspakete:
`tasks.md`

## Component Structure

```
/dashboard (HAB-1, geschützt)
└── HabitBoard                       Server Component, lädt Daten serverseitig
    ├── HabitProgress                „X von Y heute erledigt“ (reine Anzeige)
    ├── HabitForm                    GET-freies POST-Formular → Server Action `createHabit`
    ├── HabitList                    Liste, sortiert nach created_at
    │   └── HabitRow                 Name, Serie, „Heute erledigt“/„Zurücknehmen“, „Löschen“
    │       ├── ToggleHabitForm      <form action={toggleHabit}> mit hidden habitId
    │       └── DeleteHabitForm      <form action={deleteHabit}> + Rückfrage via confirm()
    └── EmptyState                   AC-7 („Noch keine Gewohnheit …“)
```

Alle interaktiven Elemente sind **Formulare mit Server Actions**, keine Client-Komponenten mit
`fetch`. Damit funktioniert die Seite ohne JavaScript (AC-10); `revalidatePath('/dashboard')`
sorgt für den sofortigen neuen Stand (AC-2, AC-4).

## Code Structure

```
src/features/habits/
  habit.schema.ts          Zod: title (trim, 1–80), habitId (uuid)          — rein
  habit.rules.ts           Serienberechnung, Tageszusammenfassung            — rein
  habit.rules.test.ts
  habit.schema.test.ts
  habit.repository.ts      Datenzugriff über @/lib/supabase/server (RLS)     — server-only
  habit.actions.ts         "use server": createHabitAction, toggleHabitAction, deleteHabitAction
  components/habit-list.tsx       Fortschritt, Leerzustand, rendert Einträge
  components/habit-form.tsx       Anlegen (Server Action, ohne Client-State)
  components/habit-item.tsx       Serie, Abhaken/Zurücknehmen, Löschen
supabase/migrations/20261102120000_habits.sql   Tabellen, Constraints, Indizes, Policies
tests/hab-3-habits.spec.ts            Playwright (Chromium + Mobile Safari)
```

Grenzen (von `scripts/check-architecture.mjs` geprüft): `rules`/`schema` importieren nichts aus
`repository`, `actions` oder `components`; `components` kennen kein Supabase; nur `repository`
und `actions` sprechen mit `@/lib/supabase/*`.

## Footprint

- **Neu:** `src/features/habits/**`, eine Migration, ein E2E-Spec.
- **Geändert:** `src/app/(protected)/dashboard/page.tsx` (Platzhalter → `HabitBoard`),
  `features/INDEX.md` (Status).
- **Nicht angefasst:** Auth-Feature, Wetter-Feature, `src/proxy.ts`, `.env*`, Supabase-Konfiguration.

## Quality and Failure Behavior

| Situation | Verhalten |
|---|---|
| Name leer / > 80 Zeichen (AC-9) | Zod-Fehler → deutsche Meldung im Formular, kein Insert |
| Doppelklick / zwei Tabs (AC-3, EC-3) | `upsert(..., { onConflict: 'habit_id,entry_date' })` für Abhaken, `delete` für Zurücknehmen — beides idempotent |
| Supabase nicht erreichbar (EC-4) | Repository fängt Fehler, gibt `{ ok: false, message: 'Gewohnheiten konnten nicht geladen werden.' }` zurück; Board rendert Fehler-Alert statt zu werfen |
| Fremde Zeile (AC-8) | RLS liefert 0 Zeilen; Update/Delete treffen nichts — kein Fehler, kein Leak |
| Zukunftstag (AC-9) | Check-Constraint `entry_date <= current_date` in der DB; Service setzt `entry_date` ausschließlich auf `current_date` |
| Viele Gewohnheiten (EC-1) | Query mit `.order('created_at')`, Liste scrollbar, keine Pagination im MVP |

## Data Model

Verbatim `docs/data-model.md`: `habits(id, user_id, title, created_at)` und
`habit_entries(id, habit_id, user_id, entry_date, created_at)`, `unique (habit_id, entry_date)`,
`ON DELETE CASCADE` auf beiden FKs, RLS-Policies mit `user_id = auth.uid()` für alle vier
Operationen. Migration ist idempotent formuliert (`create table if not exists`,
`drop policy if exists` vor `create policy`), damit ein erneutes `supabase db reset` nicht bricht.

## Behaviors & Access

- **Lesen:** `HabitRepository.listForUser()` — `select` auf `habits` inklusive der Einträge des
  laufenden Monats, damit die Serie ohne zweite Abfrage berechenbar ist. RLS filtert.
- **Anlegen:** `insert` mit `user_id` aus `auth.getUser()`; die ID kommt nie aus dem Formular.
- **Abhaken:** `upsert` auf `habit_entries` mit `onConflict: 'habit_id,entry_date'`,
  `ignoreDuplicates: true` → AC-3/EC-3 ohne Fehlerpfad.
- **Zurücknehmen:** `delete` auf `(habit_id, entry_date = heute)`; idempotent.
- **Löschen:** `delete` auf `habits` per ID; Kaskade räumt Einträge (AC-6).
- **Identität:** jede Action prüft zuerst `getSessionUser()`; ohne Session → `redirect('/login')`.

## Dependencies

- Neu: keine. `@supabase/ssr`, `@supabase/supabase-js`, `zod`, UI-Komponenten sind aus HAB-1/Kit
  vorhanden.
- Vorausgesetzt: HAB-1 (Session, `getSessionUser`, Tailwind/shadcn, `Alert`).

## Settings the user makes

- **Keine neue Env-Variable** — die Migration läuft lokal über `npx supabase db reset` (oder
  `supabase migration up`); im gehosteten Betrieb wird die Migration mit `supabase db push`
  eingespielt. Beides braucht nur die bereits vorhandenen Zugangsdaten, die nicht ins Repo gehören.

## Technical Decisions

- **Serie in reinem Modul (`habit.rules.ts`)** — die Berechnung bekommt eine Liste von
  `entry_date`-Strings plus „heute“ als Parameter. Kein `new Date()` in der Funktion, damit Tests
  mit festem Datum laufen (wie `weather.rules`).
- **Serientoleranz heute/gestern** (AC-5): Serie zählt rückwärts ab heute; ist heute offen, wird
  ab gestern gezählt. Zwei Lücken → 0.
- **Upsert statt Insert+Ignore:** ein Roundtrip, und die Unique-Verletzung wird gar nicht erst
  erzeugt (kein Fehlerlog-Rauschen, AC-3).
- **`entry_date` kommt vom Server, nicht aus dem Formular** — ein manipuliertes Formular kann
  keinen Vergangenheits-/Zukunftseintrag schreiben; die DB prüft zusätzlich.
- **Keine Client-Komponenten** — Server Actions + `revalidatePath` erfüllen AC-2/AC-4 ohne
  zusätzlichen State und halten die Seite ohne JS benutzbar (AC-10).
- **Löschen mit `confirm()`** — die Rückfrage aus AC-6 ist ohne zusätzliche Dialog-Komponente
  erfüllt; ohne JS entfällt die Rückfrage, dafür bleibt die Aktion serverseitig autorisiert.
- **Kein `service_role`** — der Schlüssel wäre ein Bypass an RLS vorbei; die App braucht ihn nicht.

## Open Questions

- _keine_ — die offenen Produktfragen sind im Decision Log der Spec entschieden.
