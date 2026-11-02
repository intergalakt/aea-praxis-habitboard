# Unabhängiger QA-Review (Kimi)

**Datum:** 2026-11-02
**Prüfer:** unabhängiger QA-Reviewer (nicht der Bauende)
**Art der Prüfung:** rein lesend; kein Code geändert

---

## Gesamtergebnis: BESTANDEN (mit 1 geringfügigem Befund)

| # | Prüfpunkt | Ergebnis |
|---|-----------|----------|
| 1 | Feature-Artefakte, AC-IDs, INDEX-Status | ✅ bestanden, 1 Minor-Befund (AC-1 fehlt in HAB-3 `design.md`) |
| 2 | Git-Reihenfolge spec → build → qa | ✅ bestanden |
| 3 | Keine Secrets im Repo / in der Historie | ✅ bestanden |
| 4 | `npm run check` | ✅ Exit 0 |
| 5 | RLS-Migration mit `auth.uid()` auf allen Tabellen | ✅ bestanden |

---

## 1) Feature-Artefakte und AC-IDs

**Befehl:**

```bash
ls features/ && ls features/HAB-1-auth/ features/HAB-2-wetter/ features/HAB-3-habits/
```

**Ausgabe (gekürzt):**

```
features/: HAB-1-auth  HAB-2-wetter  HAB-3-habits  INDEX.md  README.md
features/HAB-1-auth/:   design.md  qa-report.md  spec.md  tasks.md
features/HAB-2-wetter/: design.md  qa-report.md  spec.md  tasks.md
features/HAB-3-habits/: design.md  qa-report.md  spec.md  tasks.md
```

Alle vier Pflichtartefakte sind je Feature vorhanden.

**Befehl (AC-ID-Verknüpfung):**

```bash
for f in HAB-1-auth HAB-2-wetter HAB-3-habits; do
  for d in spec design tasks qa-report; do
    grep -oE 'AC-[0-9]+(-[0-9]+)?' features/$f/$d.md | sort -u
  done
done
```

**Ausgabe (verdichtet):**

```
HAB-1-auth:   spec/design/tasks/qa-report = AC-1 … AC-10 (identisch)
HAB-2-wetter: spec/design/tasks/qa-report = AC-1 … AC-10 (identisch)
HAB-3-habits: spec/tasks/qa-report        = AC-1 … AC-10
              design                      = AC-2 … AC-10   ← AC-1 fehlt
```

**Befund (Minor):** `features/HAB-3-habits/design.md` referenziert AC-1 („Gewohnheit anlegen") nicht
explizit — alle `AC-1`-Treffer in der Datei sind Teil von `AC-10` (Beleg: `grep -n 'AC-1'`
liefert nur die Zeilen 22 und 107 mit „AC-10"). Die Kette AC → Task → Test bleibt über
`tasks.md` und `qa-report.md` intakt; das Design deckt das Anlegen fachlich ab, taggt es nur nicht.

**INDEX-Status:** `features/INDEX.md` listet HAB-1, HAB-2 und HAB-3 jeweils mit Status **Approved**
(Zeilen 24–26). Die drei `qa-report.md`-Dateien dokumentieren grüne Läufe
(HAB-1: AC-Status abgehakt mit Belegen; HAB-2: 55/55 Unit, 32/32 E2E; HAB-3: 79/79 Unit, 44/44 E2E).

## 2) Git-Historie in Reihenfolge spec → build → qa

**Befehl:** `git log --oneline --reverse`

**Ausgabe:**

```
998aa8e chore: Kit-Gerüst (create-ai-eng-app 0.7.7) + /init für HabitBoard
eef7b79 docs(HAB-1): Spec, Tech-Design und Tasks fuer Konten & Login
3eae517 feat(auth): Validierung, Fehler-Mapping und Login-Drosselung
adb22f6 feat(auth): Registrierung, Anmeldung, Abmeldung und geschuetzter Bereich
42072e8 feat(shell): Route-Guard via Proxy und Sicherheits-Header
5ee5f33 test(auth): E2E-Abdeckung der Abnahmekriterien AC-1 bis AC-10
a6d02ec chore: Next.js-Agentenhinweis in AGENTS.md uebernommen
1e74e2d feat(HAB-1): Auth-Guard, Formulare, Drosselung, E2E-Suite; QA-Report gruen
c1c485b docs(HAB-2): Spec, Tech-Design und Tasks fuer Wetter-Integration
6f968e4 feat(HAB-2): Ortsvalidierung und reine Wetterregeln mit Tests
e5eb73d feat(HAB-2): Open-Meteo-Client, TTL-Cache mit Single-Flight und Service
46c1022 feat(HAB-2): Wetterseite mit Suche, Karte, Attribution und E2E-Tests
16af4e4 docs(HAB-2): QA-Bericht und Feature-Index aktualisiert
2129f4b docs(HAB-3): Spec fuer Habit-Tracker (10 AC, 5 EC)
f519096 docs(HAB-3): Tech-Design fuer Habit-Tracker
5db65b3 docs(HAB-3): Tasks in Level-Struktur (Level 0 ohne Env)
132454a feat(HAB-3): Validierung und Serienlogik mit Tests (T1-T3)
c4fc9b5 feat(HAB-3): Migration fuer habits und habit_entries mit RLS (T4-T5)
e89993d feat(HAB-3): Repository und Server Actions (T6-T7)
b96f551 feat(HAB-3): Board-Oberflaeche mit Formular, Liste und Fortschritt (T8)
d5a3813 test(HAB-3): E2E-Suite fuer Board, Serien, Loeschen und Fremdzugriff (T9)
aeb4940 docs(HAB-3): QA-Bericht, Tasks abgehakt, Design-Abgleich, Index auf Approved
a1a0f56 docs: Projekt-README, Arbeitsbericht, blockierte Punkte und ER-Diagramm
```

Je Feature ist die Reihenfolge eingehalten: `docs(spec/design/tasks)` → `feat/test(build)` →
`docs(qa-report/index)`. Kein QA- oder Approved-Commit vor dem zugehörigen Build.

## 3) Secrets im Repo und in der Git-Historie

**Befehl (Historie):**

```bash
git log -p --all | grep -inE 'sb_secret|service_role|password\s*=|secret\s*=|api[_-]?key\s*=|eyJ[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{10,}'
```

**Ausgabe (Bewertung der Treffer):**

- Dokumentations- und Kit-Texte über `service_role`/Passwort-Handling (keine Werte).
- `const PASSWORD = "Gewohnheit2026";` — Test-Passwort in den E2E-Specs, kein echtes Secret.
- `openai_api_key = "env(OPENAI_API_KEY)"`, `secret = "env(...)"` in `supabase/config.toml` —
  env-Referenzen, keine Werte.
- `sha512`-Integrity-Hashes in `package-lock.json` — keine Secrets.
- **Kein echter Schlüssel, kein `sb_secret`-Wert, kein JWT in der Historie.**

**Befehl (Arbeitsbaum + Ignore-Status):**

```bash
git ls-files | grep -iE 'env|secret|credential|\.pem|\.key'   # → nur .env.local.example
git check-ignore .env.local                                    # → gitignored
git check-ignore supabase/.temp/start-secrets/.../docker.env   # → gitignored
git ls-files supabase/   # → nur config.toml + migrations/20261102120000_habits.sql
```

**Ausgabe/Feststellung:** Versioniert sind ausschließlich `.env.local.example` (Dummy-Werte),
`supabase/config.toml` und die Migration. `.env.local` ist gitignored. Die lokalen Keys unter
`supabase/.temp/start-secrets/` (`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_INTERNAL_SECRET_KEY=sb_secret_…`) sind die bekannten lokalen Supabase-**Demo**-Keys
(`"iss": "supabase-demo"`, erzeugt von `supabase start`) und sind **nicht versioniert** — kein
Handlungsbedarf.

## 4) `npm run check`

**Befehl:** `npm run check` (= `lint && typecheck && check:structure && test && build`)

**Ausgabe:**

```
> eslint                                                → keine Fehler/Warnungen
> next typegen && tsc --noEmit                          → ✓ Types generated successfully
> node scripts/check-architecture.mjs                   → Architecture: 114 modules scanned, 0 errors.
> vitest run                                            → Test Files 9 passed (9), Tests 79 passed (79)
> next build                                            → ✓ Compiled successfully
                                                          ✓ Generating static pages (7/7)
  Route (app): ○ /  ○ /_not-found  ƒ /dashboard  ƒ /login  ○ /signup  ƒ /wetter
```

**Exit-Code: 0** — vollständig grün.

## 5) RLS-Migration

**Befehl:** `ls supabase/migrations/` + Review der Datei

**Ausgabe:**

```
20261102120000_habits.sql
```

Die Migration legt genau zwei Tabellen an (`create table`-Suche über `supabase/` bestätigt: keine
weiteren). Beide erhalten RLS und vollständige `auth.uid()`-Policies:

```sql
alter table public.habits        enable row level security;   -- Zeile 43
alter table public.habit_entries enable row level security;   -- Zeile 44
```

- `habits`: Policies `habits_select_own`, `habits_insert_own`, `habits_update_own`,
  `habits_delete_own` — jeweils `user_id = (select auth.uid())` (Zeilen 47–62).
- `habit_entries`: Policies `habit_entries_select_own`, `habit_entries_insert_own`,
  `habit_entries_update_own`, `habit_entries_delete_own` — jeweils `user_id = (select auth.uid())`;
  die Insert-Policy verlangt zusätzlich, dass der Eintrag zu einer eigenen Gewohnheit gehört
  (`exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))`,
  Zeilen 69–78).

**Feststellung:** Alle anwendungseigenen Tabellen sind RLS-geschützt, jede Policy bindet die Zeile
an `auth.uid()`. (`auth.users` ist Supabase-verwaltet und nicht Gegenstand dieser Migration.)
Der QA-Report von HAB-3 belegt zusätzlich per E2E-Test (Fremdzugriff, T9), dass die Policies
wirksam sind.

---

## Befunde

| Schwere | Befund |
|---------|--------|
| Minor | `features/HAB-3-habits/design.md` referenziert AC-1 nicht explizit (nur AC-2…AC-10). Die Verknüpfung bleibt über `tasks.md`/`qa-report.md` nachvollziehbar; bei nächster `/refine`-Gelegenheit nachtragen. |

Keine Critical-/High-Befunde. Kein Code wurde geändert.
