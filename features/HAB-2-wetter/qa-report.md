# QA Test Results — HAB-2 Wetter-Integration

**Feature:** Öffentliche Open-Meteo-Abfrage (aktuelles Wetter + Tagesspanne) für einen gewählten Ort
**Datum:** 2026-11-02
**Umgebung:** lokal, Next.js 16.4.4 (Turbopack), Node 24, Open-Meteo Live-API (kein Schlüssel)
**Tester:** Hermes (automatisiert + manuelle Live-Prüfung)

### Ausgeführte Prüfungen

| Prüfung | Kommando | Ergebnis |
|---|---|---|
| Lint | `npm run lint` | 0 Fehler, 0 Warnungen |
| Typecheck | `npm run typecheck` (`next typegen` + `tsc --noEmit`) | ok |
| Architektur | `node scripts/check-architecture.mjs` | ok (keine Grenzverletzung) |
| Unit-Tests | `npx vitest run` | **55/55 grün** (7 Dateien) |
| davon HAB-2 | `npx vitest run src/features/weather` | **39/39 grün** (5 Dateien) |
| E2E | `npx playwright test` | **32/32 grün** (Chromium + Mobile Safari) |
| Build | `npm run build` | Route `/wetter` als `ƒ` (dynamisch) gebaut |
| Mutationstest | 2 Mutationen in `weather.rules.ts` | **erkannt** (3 Tests rot), Datei wiederhergestellt |

### Acceptance Criteria Status

#### AC-1: `/wetter` ist ohne Anmeldung erreichbar — ✅ PASS
`GET /wetter` → HTTP 200 ohne Session; `proxy.ts`-Matcher deckt nur `/dashboard`, `/login`, `/signup` ab, die Route bleibt bewusst öffentlich. E2E `AC-1` prüft Überschrift, URL und sichtbaren Anmelde-Link. Auffindbarkeit über Links auf `/` und in der Board-Kopfzeile.

#### AC-2: Ortssuche zeigt aktuelles Wetter samt Ortszeit — ✅ PASS
Live: `GET /wetter?ort=Freiburg` → „Freiburg im Breisgau, Baden-Württemberg, Deutschland“, 6,4 °C, „Teilweise bewölkt“, „Stand: 02.11.2026, 20:45 Uhr“ (Zeitzone des Ortes, nicht Serverzeit). E2E `AC-2/AC-3` prüft Ortslabel, `°C`-Wert und Uhrzeitformat.

#### AC-3: Tagesspanne max/min wird angezeigt — ✅ PASS
Live: „0,3 °C bis 10,4 °C“ aus `daily.temperature_2m_max/min[0]`. E2E prüft den „bis“-Text.

#### AC-4: Eingabe wird validiert, nicht roh weitergegeben — ✅ PASS
`placeQuery`: trim, 2–80 Zeichen. Der Wert geht ausschließlich URL-encodiert als Query-Parameter an die API, nie in SQL/HTML/Shell. `weather.schema.test.ts` deckt Trim, reine Leerzeichen, 80/81-Zeichen-Grenze, Umlaute und Bindestriche ab; `weather.client.test.ts` prüft die Prozent-Kodierung im Request.

#### AC-5: Upstream-Fehler werden zu deutschen Meldungen, nicht zu 500 — ✅ PASS
`WeatherUpstreamError` + `AbortSignal.timeout(3000)`; Service liefert eine Ergebnis-Union. Live: `?ort=Xyzzyxq` → HTTP 200 + „Für diesen Ort wurden keine Daten gefunden. Prüfe die Schreibweise.“ E2E `AC-9/EC-4` prüft Status 200.

#### AC-6: Wiederholte Abfragen treffen den Upstream nicht doppelt — ✅ PASS
TTL 10 min + Single-Flight in `weather.cache.ts`. Messung: erste Anfrage 290 ms, zweite 51 ms. Unit-Tests prüfen TTL-Ablauf, Single-Flight und Fehler-Nicht-Caching.

#### AC-7: Open-Meteo wird nur serverseitig aufgerufen — ✅ PASS
`import "server-only"` in Client/Service/Cache; Seite ist Server Component. E2E `AC-7` lauscht auf alle Requests und findet **0** direkte Aufrufe an `*.open-meteo.com` aus dem Browser.

#### AC-8: Attribution ist sichtbar — ✅ PASS
`WeatherAttribution` verlinkt `https://open-meteo.com/` mit „(CC BY 4.0)“. E2E prüft Link, href und Lizenztext.

#### AC-9: Zu kurze oder leere Eingabe wird verständlich abgewiesen — ✅ PASS
Live: `?ort=a` und `?ort=%20%20` → HTTP 200 + „Bitte gib einen Ort mit mindestens zwei Zeichen ein.“

#### AC-10: Datums-/Zeitformat ist deutsch und ortsbezogen — ✅ PASS
Open-Meteo liefert `current.time` wegen `timezone=auto` bereits in Ortszeit („2026-11-02T20:15“), eine eigene Zeitzonen-Umrechnung entfällt bewusst. `formatLocalTime()` formatiert daraus „02.11.2026, 20:15 Uhr“; Unit-Tests decken gültige Formate und unerwartete Eingaben (leerer String statt „Invalid Date“) ab.

### Edge Cases Status

#### EC-1: Tagesgrenze / fehlende Stundenwerte — ✅ PASS
`todayRange()` liest nur `daily[0]` und ersetzt fehlende Werte durch `NaN`, `formatTemperature()` rendert daraus „–“. Fehlt `current` ganz, meldet der Service `unavailable` — nie „undefined °C“.

#### EC-2: Sonderzeichen und Umlaute im Ortsnamen — ✅ PASS
`encodeURIComponent` im Client; Live-Test mit „München“ und „Sankt Goar“ liefert korrekte Treffer.

#### EC-3: Gleichzeitige Anfragen (Single-Flight) — ✅ PASS
Unit-Test: zwei parallele `get()`-Aufrufe erzeugen genau einen Loader-Aufruf.

#### EC-4: Unbekannter WMO-Code — ✅ PASS
`describeWeatherCode()` fällt auf „Unbekannte Wetterlage“ zurück (Mutationstest bestätigt, dass der Test das erkennt).

#### EC-5: Upstream-Timeout — ✅ PASS
`AbortSignal.timeout(3000)`; abgebrochene Anfragen werden als `unavailable` gemeldet und **nicht** gecacht (Unit-Test).

### Security Audit Results

- Kein API-Schlüssel, kein Secret, keine neue Env-Variable — Open-Meteo ist schlüsselfrei. `.env*` blieb unverändert; Werte wurden nicht gelesen oder ausgegeben.
- Keine Nutzerdaten an den Anbieter: nur der eingegebene Ortsname verlässt den Server.
- `server-only` verhindert versehentlichen Import in Client-Bundles; Architektur-Check grün.
- Kein `dangerouslySetInnerHTML` im Feature; Ortsname wird als Text gerendert (React-Escaping).
- Fehlermeldungen nennen keine Upstream-URLs, Stacktraces oder Statuscodes.

### E2E Tests

`tests/hab-2-wetter.spec.ts` — 7 Tests × 2 Projekte (Chromium, Mobile Safari):
AC-1, AC-2/AC-3, AC-8, AC-9/EC-4, AC-9 (kurz), AC-7 (Netzwerk-Mitschnitt), AC-2 ohne JavaScript.

### Testqualität

Zwei gezielte Mutationen in `weather.rules.ts` (Fallback-Text, `NaN`-Ausgabe) wurden von den Unit-Tests **erkannt** (3 rote Tests). Damit ist die HAB-2-Testsuite schärfer als die HAB-1-Suite, bei der zwei Mutationen unbemerkt blieben.

### Nicht in diesem Lauf verifiziert

- Verhalten bei echtem Open-Meteo-Ausfall (503/Netzwerkfehler) — nur über den Timeout/Fehlerpfad im Unit-Test abgedeckt, nicht live provoziert.
- Rate-Limits von Open-Meteo unter Last — der 10-Minuten-Cache senkt die Last, ein Lasttest war nicht Teil des Auftrags.
- Barrierefreiheit über die geprüften Rollen/Labels hinaus (kein axe-Scan).

### Bugs Found

#### BUG-1 (behoben): Zeitangabe war nicht testbar formuliert
Der E2E-Test suchte die Uhrzeit mit `^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2} Uhr$`, im DOM steht sie aber als „Stand: …“ innerhalb eines Absatzes. Test auf den tatsächlichen Text angepasst; die Anzeige selbst war korrekt.

#### BUG-2 (behoben): `server-only` blockierte Unit-Tests
Das Guard-Paket wirft beim Import außerhalb einer Server-Komponente, wodurch Client/Service/Cache in Vitest nicht ladbar waren. Gelöst über einen Alias in `vitest.config.mts` auf `src/test/server-only-stub.ts` — das Guard bleibt im Produktionscode aktiv.

#### BUG-3 (dokumentiert, kein Fehler): Rundung negativer Halbwerte
`Math.round(-32.5) === -32`, deshalb ergibt −3,25 °C den Text „-3,2 °C“. Verhalten ist dokumentiert und im Test als Erwartung festgehalten, statt eine Rundung vorzutäuschen, die JS nicht liefert.

### Summary

HAB-2 erfüllt alle 10 Acceptance Criteria und alle 5 Edge Cases. 39 neue Unit-Tests (5 Dateien), 7 neue E2E-Tests (14 Ausführungen über beide Projekte), Mutationstest bestanden, Live-Verifikation gegen die echte Open-Meteo-API erfolgreich. Keine offenen Blocker; Status **Approved**.
