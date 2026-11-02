# HAB-2 — Tech Design

> Spec: `features/HAB-2-wetter/spec.md` · Stack: Next.js 16 (App Router), Server Components,
> Open-Meteo (Geocoding + Forecast, schlüsselfrei) · Arbeitspakete: `tasks.md` im selben Ordner.

## Component Structure

| Component | Responsibility | ACs |
|-----------|----------------|-----|
| `WeatherPage` (`src/app/wetter/page.tsx`) | Server Component: liest `?ort=`, ruft `getWeatherForPlace()`, rendert Suchfeld + Karte oder Fehlertext; keine Client-Datenlogik | AC-1, AC-2, AC-3, AC-5, AC-8 |
| `WeatherSearch` | Formular mit `method="get"`, Feld `ort`, Validierungshinweis, `role="status"` für Rückmeldungen | AC-1, AC-4, EC-2 |
| `WeatherCard` | Anzeige: Ort + Region + Land, aktuelles Wetter, Tages-Max/Min, Ortszeit, Datum | AC-2, AC-10, EC-1, EC-5 |
| `WeatherAttribution` | Quellenhinweis „Wetterdaten: Open-Meteo" + CC BY 4.0 | AC-8 |
| `getWeatherForPlace()` (`weather.service.ts`) | Orchestriert Geocoding → Forecast, mappt Fehler auf ein Ergebnisobjekt, nutzt Zwischenspeicher | AC-2, AC-3, AC-5, AC-6 |
| `weatherCache.remember()` (`weather.cache.ts`) | TTL 10 min + Single-Flight (geteiltes Promise) | AC-6, EC-3 |
| `describeWeatherCode()`, `formatTemperature()`, `formatLocalTime()` (`weather.rules.ts`) | reine Formatierung (WMO-Code → Deutsch, °C, Ortszeit) | AC-10, EC-5 |

## Code Structure

```
src/features/weather/
  weather.schema.ts       # Zod: placeQuery, geocodingResponse, forecastResponse — pure
  weather.rules.ts        # pure: WMO-Mapping, Temperatur-/Zeitformat, Ortsname zusammensetzen
  weather.rules.test.ts   # Unit-Tests (von /qa ergänzt)
  weather.cache.ts        # TTL + Single-Flight, injizierbare Uhr — pure bzgl. Netz
  weather.cache.test.ts
  weather.client.ts       # 'server-only': fetch mit Timeout, Zod-Parse, Fehlerklassen
  weather.service.ts      # 'server-only': getWeatherForPlace() → WeatherResult
  weather.service.test.ts # mit injiziertem fetch (kein echtes Netz)
  components/
    weather-search.tsx
    weather-card.tsx
    weather-attribution.tsx
src/app/wetter/page.tsx
```

`.`-Module ohne Next-Imports bleiben rein (`schema`, `rules`, `cache`), damit sie ohne Server und ohne
Netz testbar sind; `client`/`service` bekommen `fetch` als Parameter (Default: globales `fetch`).

## Footprint
- **Neue Abhängigkeiten:** keine — `zod` ist vorhanden, `fetch` ist im Node-Runtime von Next 16 global.
- **Neue Dateien:** 10 (siehe oben).
- **Geänderte Dateien:** `src/app/page.tsx` (Link auf `/wetter`), `src/app/(protected)/layout.tsx`
  (Navigationspunkt „Wetter"), ggf. `features/INDEX.md`.
- **Neue Umgebungsvariablen:** keine. Open-Meteo braucht keinen Schlüssel (Spec, Open Questions).

## Quality and Failure Behavior

| AC | Verhalten bei Erfolg | Verhalten bei Fehler | Beobachtbar als |
|----|----------------------|----------------------|-----------------|
| AC-1 | 200 mit Formular | — | `curl -o /dev/null -w %{http_code} /wetter` |
| AC-2 | Ort, aktuell, max/min sichtbar | Zoom-Fehler → AC-5-Text | HTML enthält Ortsname + `°C` |
| AC-3 | — | „Für diesen Ort wurden keine Daten gefunden.", 200 | HTML-Text, Statuscode 200 |
| AC-4 | — | Feldfehler, kein Upstream-Aufruf | Zähler im Test: `fetch` 0-mal |
| AC-5 | — | „Wetterdaten sind gerade nicht erreichbar…", 200 | HTML-Text, Statuscode 200 |
| AC-6 | zweiter Aufruf < 1 Upstream | — | `weather.service.test.ts` zählt Aufrufe |
| AC-7 | nur Server-Anfragen | — | Playwright: `page.on('request')` ohne `api.open-meteo.com` |
| AC-8 | Quellenhinweis | — | HTML enthält Link + „CC BY 4.0" |
| AC-9 | Eingabe als Text | Markup bleibt Text (React-Escaping), Längenprüfung | HTML-Vergleich, Zod-Test |
| AC-10 | Ortszeit + `°C` mit 1 Dezimale | — | `formatLocalTime`/`formatTemperature`-Tests, HTML |

Zeitbudget: `${TIMEOUT_MS} = 3000` pro Upstream-Aufruf, maximal zwei Aufrufe (Geocoding, Forecast) →
schlechtester Fall ~6 s, danach Fehlertext statt Hänger. Ein Retry gibt es bewusst nicht (Spec,
Product Decisions).

## Data Model
- **Keine Tabellen, keine Migration.** Wetterdaten sind flüchtig und werden nicht persistiert; der
  Zwischenspeicher liegt im Prozessspeicher (Map), nicht in der Datenbank (AC-6, Datensparsamkeit).
- Keine personenbezogenen Daten: der Ortsname steht in der URL, nicht im Konto.

## Behaviors & Access

| Behavior | Wer darf es | Durchgesetzt in |
|----------|-------------|-----------------|
| `/wetter` lesen (ohne Ort) | jeder, ohne Anmeldung | Route liegt außerhalb von `(protected)`, `proxy.ts`-Matcher deckt sie nicht ab |
| Wetter für einen Ort abfragen | jeder, ohne Anmeldung | Server Component + Zod-Längenprüfung |
| Upstream-Aufrufe | nur Server | `weather.client.ts` mit `import 'server-only'`; kein Client-`fetch` (AC-7) |
| Zwischenspeicher | Prozess | `weather.cache.ts`, TTL 10 min |

## Dependencies
Intern: keine harten. Extern: `zod` (Parsen der Upstream-Antworten), `next` (Server Components).
Reihenfolge: nach HAB-1 (App-Shell/Header existiert), vor HAB-3 (Dashboard kann das Wetter später
einbetten, muss es aber nicht).

## Settings the user makes

| Setting | Wo | Vorschlag | Warum (AC) | Wann |
|---------|----|-----------|-----------|------|
| Keine | — | — | Open-Meteo ist schlüsselfrei; es gibt nichts zu hinterlegen | — |

## Technical Decisions

1. **Server-seitiger Abruf statt Client-Fetch** — der Browser spricht nie mit Open-Meteo (AC-7);
   damit ist die Seite auch ohne JavaScript bedienbar (Formular mit `method="get"`).
2. **GET-Formular + `?ort=`** — Zustand in der URL: teilbar, im Browser-Verlauf, ohne Client-State,
   ohne Konto. Preis: der Ortsname steht in der Server-Logzeile der Seite (kein Personenbezug).
3. **Zwischenspeicher im Speicher mit Single-Flight** — AC-6 verlangt „keine zweite Upstream-Anfrage";
   ein Map mit TTL erfüllt das im Ein-Instanz-Betrieb, ein geteiltes Promise verhindert parallele
   Doppelabrufe (EC-3). Trade-off wie bei der Drosselung in HAB-1: skaliert nicht über Instanzen,
   Review-Trigger ist eine zweite Instanz.
4. **Zod auch für Upstream-Antworten** — Open-Meteo ist fremd und darf sich ändern; eine
   Schema-Abweichung soll EC-4 (Fehlertext) auslösen, nicht `undefined` in die Oberfläche tragen.
5. **Ein Timeout von 3 s, kein Retry** — drei Versuche verdreifachen die Latenz im Fehlerfall und
   treffen einen Dienst, der ohnehin Probleme hat; der Nutzer bekommt stattdessen eine klare Meldung.
6. **WMO-Codes in eigene Tabelle** — 28 Codes, deutsche Beschreibungen, ein Emoji pro Gruppe; als
   reine Funktion getestet, damit die Anzeige nicht von der API-Implementierung abhängt.
7. **Kein Standort-Speicher** — der letzte Ort bleibt in der URL (Lesezeichen), nicht in der Datenbank;
   das hält dieses Feature frei von Nutzdaten und RLS-Fragen.

## Open Questions
- [x] Braucht es einen API-Schlüssel? **Nein** (Open-Meteo, CC BY 4.0, Attribution in AC-8).
- [x] Wird das Wetter auf dem Dashboard eingebettet? **Nicht hier** — HAB-3 kann es tun, dieses
  Feature liefert nur `/wetter` (Spec, Out of Scope).
