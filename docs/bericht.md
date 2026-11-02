# Arbeitsbericht — HabitBoard

**Zeitraum:** 2026-11-02
**Ausgangslage:** leeres Kit-Projekt (`create-ai-eng-app` 0.7.7) in `C:\Users\am979\aea-praxis`
**Ergebnis:** drei Features vollständig durch Spec → Design → Tasks → Build → QA geführt,
`npm run check` grün, 79 Unit-Tests, 44 E2E-Läufe.

---

## 1. Wie ich angefangen habe

Ich habe zuerst nicht gebaut, sondern gelesen: den Auftrag vollständig, dann das Kit (README,
Skills, Rules, Architektur-Skripte), dann die bestehende Codebasis. Der Grund war unspektakulär —
das Kit bringt Regeln mit, die den Build hart brechen (`server-only`, Schichtung, Verzeichnisse),
und ich wollte die Regeln kennen, bevor ich Code schreibe, der an ihnen scheitert. Danach stand
die Reihenfolge: HAB-1 zuerst, weil jedes weitere Feature eine Session und eine `auth.uid()`-
Grundlage braucht.

Die Git-Historie habe ich von Anfang an als Erzählung behandelt: ein Commit pro Arbeitspaket,
Präfix nach Conventional Commits mit Feature-Kürzel (`docs(HAB-2): …`, `feat(HAB-3): …`).
Rückblickend war das die Entscheidung mit dem größten Nutzen — wenn ein Test rot war, ließ sich
über `git log` und `git diff` genau sagen, welcher Schritt ihn rot gemacht hat.

---

## 2. HAB-1 — Konten und Login

Der Weg war: Spec schreiben, Architektur festlegen, Tasks schneiden, bauen, E2E, QA-Bericht.
Der erste echte Fehler kam sofort und war lehrreich.

**Der Fehler:** Nach der Registrierung landete der Test auf `/dashboard` statt auf der
Bestätigungsseite. Ursache war nicht das Formular, sondern Supabase selbst: `signUp` legt lokal
sofort eine Session an, der Proxy sieht sie und leitet `/login` auf `/dashboard` um. Die
dokumentierte Weiterleitung war damit unerreichbar. Fix: `signUpAction` verwirft die frische
Session — der Nutzer meldet sich bewusst an, statt implizit eingeloggt zu werden. Das ist auch
fachlich richtig: „Konto angelegt“ und „angemeldet“ sind zwei verschiedene Zustände.

**Der zweite Fehler** war ein Testfehler, kein Produktfehler: `getByText(email)` traf mehrere
Elemente. Mit `.first()` war es erledigt — aber ich habe daraus die Regel gemacht, Locatoren
immer auf genau ein Element zu zeigen, statt sie zu „reparieren“.

**Mobile Safari** fiel zunächst komplett aus, weil WebKit fehlte. Statt das Projekt zu
überspringen (was die Suite grün, aber wertlos gemacht hätte), habe ich `npx playwright install
webkit` ausgeführt und beide Projekte grün bekommen.

**Was ich verschärft habe:** Die Passwortrichtlinie im lokalen Supabase-Config stand auf
Mindestlänge 6. Für ein SaaS ist das zu wenig; ich habe auf 10 plus
`lower_upper_letters_digits` gestellt und die Änderung als eigenen Task geführt.

**Was offen blieb:** Zwei Mutationen an `auth.rules.ts` blieben von den 12 Tests unentdeckt.
Ich habe die Datei zurückgespielt und die Lücke im QA-Bericht festgehalten, statt die Zahl
schönzureden.

---

## 3. HAB-2 — Wetter

Hier war die Versuchung groß, eine Bibliothek oder einen API-Key zu nehmen. Ich habe mich für
Open-Meteo entschieden: Geocoding und Forecast ohne Schlüssel, also ohne Secret im Projekt und
ohne Env-Abhängigkeit — der einzige „Konfigurationsaufwand“ ist keiner. Das passt zur
Kit-Regel, dass Level 0 ohne neue Env lauffähig sein soll.

Der Aufbau folgt der Schichtung: reine Formatierungs- und Auswahlregeln unten (testbar ohne
Netz), darüber ein Cache mit TTL, ein `server-only`-Client für HTTP und ein Service, der beides
verbindet. Die Seite selbst ist eine Server Component — der Browser spricht nie mit Open-Meteo,
was ein E2E-Test ausdrücklich prüft.

**Zwei Details, die Zeit gekostet haben:**

*Rundung.* Der Test erwartete `-3,3 °C`, die App lieferte `-3,2 °C`. Nicht die App war falsch,
sondern meine Erwartung: `Math.round(-32.5)` ergibt in JavaScript `-32`. Ich habe den Test
korrigiert und den Grund im Code kommentiert, damit niemand die „falsche“ Rundung später
zurückdreht.

*Umlaute.* Mehrere `curl`-Prüfungen lieferten HTTP 200, aber leere Trefferlisten. Ursache war
die Extraktion (Regex/Pfad), nicht die App — die Seiten rendern „München“ korrekt. Ich habe die
Prüfung als nicht belegt dokumentiert, statt sie als bestanden zu verbuchen.

**Attribution:** Die Lizenz von Open-Meteo verlangt eine Quellenangabe. Ich habe sie als eigene
Komponente gebaut, weil Board-Kopfzeile und Wetterseite dieselbe Angabe teilen — eine Zeile
Footer hätte an zwei Stellen gepflegt werden müssen.

---

## 4. HAB-3 — Habit-Tracker

Die Spec war der aufwendigste Teil: 10 Acceptance Criteria, 5 Edge Cases, und die Frage, was
„Serie“ eigentlich heißt, wenn für heute noch nichts eingetragen ist. Entscheidung: Eine Serie
reißt nicht ab, nur weil der Tag noch läuft — gezählt wird ab gestern, wenn heute fehlt.

**Die eine Architekturentscheidung, die alles einfacher gemacht hat:** `calculateStreak` und
`summarizeToday` bekommen „heute“ als Parameter (`YYYY-MM-DD`) und rufen intern kein
`new Date()` auf. Damit sind mehrjährige Serien, Lücken und Mitternachtsfälle in Millisekunden
testbar — ohne Systemzeit-Manipulation, ohne Flakiness.

**Titel zählen in Code Points.** `"🏃".length` ist 2, `[... "🏃"].length` ist 1. Wer 80 Emoji
eingibt, hat 80 Zeichen eingegeben, nicht 160. Schema, Zählung und Datenbank-Constraint sagen
dasselbe.

**RLS ernst genommen.** Eine Policy zu schreiben ist einfach; zu wissen, ob sie greift, nicht.
Ich habe zwei Konten über die Auth-API angelegt und mit dem `anon`-Key gegeneinander getestet:
B sieht null Zeilen, B bekommt auf einen fremden Insert 403, und Bs `DELETE` auf eine fremde
Gewohnheit antwortet mit `204` — gelöscht wird trotzdem nichts, A sieht seine Zeile danach
weiterhin. Genau dieser Fall ist der Grund, warum „Statuscode 204“ kein Sicherheitsbeweis ist.
Die Testkonten habe ich anschließend entfernt.

**Ohne JavaScript.** Statt es zu behaupten, habe ich einen Playwright-Kontext mit
`javaScriptEnabled: false` aufgesetzt: registrieren, anmelden, Gewohnheit anlegen, abhaken —
funktioniert vollständig, weil alle Formulare Server Actions ohne Client-State nutzen.
Der Preis: Fehlermeldungen kommen als `?fehler=name` zurück, das Formular verliert die Eingabe.
Für den MVP ist das der bessere Tausch — Rückmeldung ohne Skript schlägt Komfort mit Skript.

---

## 5. Was ich gelernt habe

1. **Erst die Regeln, dann den Code.** Die Kit-Guards haben zweimal einen Import im Client
   verhindert, den ich sonst erst im Bundle gemerkt hätte.
2. **Ein Commit pro Arbeitspaket ist kein Formalismus.** Er ist der einzige Grund, warum sich
   ein roter Test nach 40 Änderungen noch zuordnen lässt.
3. **Statuscodes lügen.** `204` auf ein fremdes Delete sieht nach Erfolg aus; erst der
   Gegencheck mit dem zweiten Konto beweist die Policy.
4. **Tests, die zu streng sind, sind auch Fehler.** Emoji-Länge und Rundung waren zweimal
   falsch erwartet — beide Male war die App richtig.
5. **Nicht belegt bleibt nicht belegt.** Bei den Umlaut-Checks und beim Mutationstest steht im
   Bericht „nicht nachgewiesen“, nicht „bestanden“.

---

## 6. Stand am Ende

| Prüfung | Ergebnis |
|---|---|
| `npm run check` (Lint, Typen, Architektur, Unit, Build) | Exit 0 |
| Vitest | 79 Tests, 9 Dateien, alle grün |
| Playwright (Chromium + Mobile Safari) | 44 Läufe, alle grün |
| RLS-Gegenprobe mit zwei Konten | kein Fremdzugriff möglich |
| Formulare ohne JavaScript | funktionsfähig |

Offen und dokumentiert: Teststärke von `auth.rules.test.ts` (B-3), kein Remote-Push wegen
ungültigem Token (B-1), kein Deployment (nicht gefordert).
