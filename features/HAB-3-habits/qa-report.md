# QA Test Results — HAB-3 Habit-Tracker

**Feature:** Gewohnheiten anlegen, täglich abhaken, Serie und Fortschritt sehen — privat pro Konto
**Datum:** 2026-11-02
**Umgebung:** lokal, Next.js 16 (App Router) auf `http://localhost:3000`, Supabase lokal auf
`http://127.0.0.1:54321`, Node 24, Chromium + Mobile Safari (WebKit `webkit-2370`)
**Tests:** `npx vitest run` → **79/79 grün** (9 Dateien) · `npx playwright test` → **44/44 grün**
(22 Tests × 2 Projekte) · `npm run check` Exit 0 · `npm run build` erfolgreich
**Geprüft von:** Hermes (automatisiert), Feature-Spec `features/HAB-3-habits/spec.md`

---

### Acceptance Criteria Status

#### AC-1: Gewohnheit anlegen
✅ **PASS** — „10 Minuten lesen“ im Feld *Neue Gewohnheit* → Eintrag erscheint sofort in der Liste.
E2E: `AC-1/AC-2: Gewohnheit anlegen und abhaken` (Chromium + Mobile Safari).

#### AC-2: Abhaken und Zurücknehmen
✅ **PASS** — Zähler springt von `0 von 1 heute erledigt` auf `1 von 1`, Zeile wechselt auf
„Heute erledigt“, Button auf „Zurücknehmen“. Zurücknehmen setzt beides zurück.

#### AC-3: Doppeltes Abhaken ist kein Fehler
✅ **PASS** — Datenbankseitig abgesichert: `unique (habit_id, entry_date)`, Repository nutzt
`upsert … ignoreDuplicates`. API-Probe: zweiter Insert → **409**, kein zweiter Datensatz;
die Oberfläche bleibt bei `1 von 1`.

#### AC-4: Serie zählt aufeinanderfolgende Tage
✅ **PASS** — Nach dem ersten Abhaken steht „1 Tag in Folge“ (E2E). Mehrtaageserien sind in
`habit.rules.test.ts` mit festen Daten geprüft: heute+zwei Vortage → 3, Lücke → Zählung ab Vortag.

#### AC-5: Fortschritt des Tages
✅ **PASS** — `summarizeToday`/`formatProgress` liefern „X von Y heute erledigt“; bei leerem Board
greift der Leerzustand (AC-7). E2E prüft beide Zahlen.

#### AC-6: Löschen entfernt Gewohnheit und Einträge
✅ **PASS** — „Löschen“ entfernt die Zeile, Board fällt auf den Leerzustand zurück (E2E).
Einträge räumt `on delete cascade`; im Schema als FK-Constraint hinterlegt.

#### AC-7: Leerer Zustand
✅ **PASS** — „Noch keine Gewohnheiten. Lege oben die erste an …“ statt leerer Fläche (E2E).

#### AC-8: Nutzer sehen ausschließlich eigene Daten
✅ **PASS, mit Beleg** — RLS auf beiden Tabellen (`habits`, `habit_entries`), je vier Policies.
Live-Probe über die REST-API mit zwei frisch registrierten Konten:

| Prüfung | Ergebnis |
|---|---|
| B liest `habits` (select all) | **`200 []`** |
| B liest gezielt per `id=eq.<fremd>` | **`200 []`** |
| B löscht fremde Gewohnheit | **`204`**, danach sieht A seine Zeile weiterhin → **No-Op** |
| B legt Eintrag auf fremder Gewohnheit an | **`403`** (Policy mit `exists`-Prüfung) |
| A sieht eigene Zeilen | **1** |

Testkonten und deren Daten wurden anschließend über die Admin-API entfernt.

#### AC-9: Ungültige Namen werden abgelehnt und gemeldet
✅ **PASS** — Leerzeichen als einziger Inhalt → `?fehler=name` plus Meldung „Bitte gib einen Namen
mit 1 bis 80 Zeichen ein.“ (E2E). Datenbankseitig zusätzlich
`check (char_length(btrim(title)) between 1 and 80)` → API-Insert mit `"   "` ergibt **400**.
Zukunfts-Einträge blockt `check (entry_date <= current_date)`, API-Probe **400**.

#### AC-10: Board nur mit Anmeldung, Formulare ohne JavaScript nutzbar
✅ **PASS** — Ohne Session leitet jede Action auf `/login?next=/dashboard`.
Ohne JavaScript (Playwright-Kontext `javaScriptEnabled: false`) lassen sich Registrieren, Anmelden,
Anlegen und Abhaken vollständig durchklicken — E2E `AC-10: … ohne JavaScript`.

### Edge Cases Status

#### EC-1: Zwei Tabs, gleicher Tag
✅ **PASS** — zweiter Insert scheitert am Unique-Constraint, `ignoreDuplicates` macht daraus ein
No-Op; kein doppelter Eintrag, keine Fehlermeldung.

#### EC-2: Serie über Mitternacht
✅ **PASS** — `calculateStreak` nimmt „heute“ als Parameter; liegt für heute kein Eintrag vor, zählt
die Serie ab gestern weiter, statt auf 0 zu fallen. Grenzfall „nur heute“ → 1, „gestern + heute“ → 2.

#### EC-3: Doppelklick auf „Abhaken“
✅ **PASS** — identisch zu EC-1; Action und DB sind beide idempotent.

#### EC-4: Sehr lange Namen
✅ **PASS** — `maxLength={80}` im Feld, Zod 1–80 Zeichen, DB-Constraint identisch; 81 Zeichen werden
an allen drei Stellen abgewiesen.

#### EC-5: Emoji und Umlaute im Namen
✅ **PASS** — Zählung in Code Points (`[...title].length`), Tests mit „🏃“ × 80 (erlaubt) und × 81
(abgelehnt), Umlaute unverändert gespeichert.

### Security Audit Results

| Prüfung | Ergebnis |
|---|---|
| RLS aktiv auf `habits` / `habit_entries` | ✅ `enable row level security` in der Migration |
| Policies je Operation (select/insert/update/delete) | ✅ 4 + 4, jeweils `user_id = auth.uid()` |
| `user_id` aus dem Formular manipulierbar | ✅ nein — kommt aus der Session (`getSessionUser`) |
| Fremdzugriff über die API | ✅ leer / 403 / wirkungsloses Delete |
| `service_role` im Client | ✅ nicht verwendet; Repository nutzt den Server-Client |
| Eingaben in SQL/HTML interpoliert | ✅ nein — Supabase-Client + React-Escaping |
| Zukunfts-Einträge | ✅ DB-Constraint + serverseitiges Datum |

### E2E Tests

`tests/hab-3-habits.spec.ts` — 7 Tests, je Projekt (Chromium, Mobile Safari):

1. `AC-7` Leerzustand
2. `AC-1/AC-2` Anlegen und Abhaken
3. `AC-4` Serie von 1 Tag
4. `AC-9` leerer Name wird abgelehnt
5. `AC-6` Löschen
6. `AC-10` ohne JavaScript
7. `AC-8` fremde Gewohnheiten unsichtbar (zweiter Browser-Kontext)

### Nicht in diesem Lauf verifiziert

- **Mehrtägige Serien in der Oberfläche** — nur als Unit-Test mit festen Daten; E2E kann die
  Systemzeit nicht glaubwürdig verschieben. Bewusste Grenze, kein offener Fehler.
- **Lastverhalten** — keine Messung bei vielen Gewohnheiten/Einträgen; das Datenmodell deckt den
  MVP-Umfang ab, ein Lasttest steht aus.
- **Barrierefreiheit über die Tastaturbedienung hinaus** — Fokusreihenfolge und Screenreader sind
  nicht systematisch geprüft.

### Bugs Found

#### BUG-1: `getByText("Heute erledigt")` traf zwei Elemente
Der Test schlug an einer Locator-Kollision fehl (`1 von 1 heute erledigt` enthält denselben Text),
nicht an einem Produktfehler. **Behoben** durch Präzisierung auf `"Heute erledigt ·"`.

#### BUG-2: Emoji-Länge wurde falsch gezählt (Test)
`toHaveLength(80)` zählt UTF-16-Einheiten, ein Emoji belegt zwei. Der Test war zu streng, die
Implementierung korrekt. **Behoben** mit `[...title].length`.

### Summary

**10 von 10 Acceptance Criteria bestanden, 5 von 5 Edge Cases bestanden.** Kein offener Produktfehler.
Die beiden gefundenen Bugs betrafen ausschließlich Testformulierungen. Die RLS-Regeln sind nicht nur
deklariert, sondern mit zwei Konten live gegen die API geprüft — inklusive des Falls, dass ein
fremdes `Delete` mit `204` antwortet und trotzdem nichts löscht.
