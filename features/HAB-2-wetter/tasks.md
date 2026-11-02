# HAB-2 Tasks

> Spec: `spec.md` · Design: `design.md` · ein Arbeitspaket = ein Commit-Häppchen, Reihenfolge
> innerhalb einer Ebene ist verbindlich.

## Level 0 — Grundlagen (keine Env, keine Konfiguration)

Open-Meteo braucht keinen Schlüssel, es gibt nichts zu hinterlegen (Design → Settings the user makes).
Deshalb beginnt dieses Feature direkt bei den reinen Modulen.

## Level 1 — Reine Module (ohne Netz, ohne Next)

- [x] T1 [P]  `weather.schema.ts` — Zod: `placeQuery` (2–80 Zeichen, trim), `geocodingResponse`,
      `forecastResponse`  · files: src/features/weather/weather.schema.ts  · → AC-4, AC-9, EC-4
- [x] T2 [P]  `weather.rules.ts` — `describeWeatherCode()` (WMO → Deutsch), `formatTemperature()`
      (1 Dezimale, °C), `formatLocalTime()` (Zeitzone des Ortes), `buildPlaceLabel()`
      · files: src/features/weather/weather.rules.ts  · → AC-2, AC-10, EC-1, EC-5
- [x] T3 [P]  `weather.cache.ts` — TTL 10 min + Single-Flight, injizierbare Uhr
      · files: src/features/weather/weather.cache.ts  · → AC-6, EC-3

## Level 2 — Netzzugriff (Server-only)

- [x] T4  `weather.client.ts` — `fetchGeocoding()`, `fetchForecast()` mit `AbortSignal.timeout(3000)`,
      Zod-Parse, Fehlerklassen (`WeatherUpstreamError`)  · files: src/features/weather/weather.client.ts
      · → AC-5, EC-4
- [x] T5  `weather.service.ts` — `getWeatherForPlace(query, deps)`: Geocoding → Forecast, Cache,
      Ergebnis-Union `{ok:true,…} | {ok:false,reason}`  · files: src/features/weather/weather.service.ts
      · → AC-2, AC-3, AC-5, AC-6

## Level 3 — UI

- [x] T6  [P]  `WeatherSearch` (GET-Formular, `label`, `role="status"`)
      · files: src/features/weather/components/weather-search.tsx  · → AC-1, AC-4
- [x] T7  [P]  `WeatherCard` (Ort/Region/Land, aktuell, max/min, Ortszeit) und `WeatherAttribution`
      · files: src/features/weather/components/weather-card.tsx,
      src/features/weather/components/weather-attribution.tsx  · → AC-2, AC-8, AC-10
- [x] T8  Seite `/wetter` (Server Component, `?ort=`, Fehlerzustände)
      · files: src/app/wetter/page.tsx  · → AC-1, AC-3, AC-5, AC-8
- [x] T9  Navigation: Link auf `/wetter` in Startseite und Kopfzeile
      · files: src/app/page.tsx, src/app/(protected)/layout.tsx  · → AC-1 (Auffindbarkeit)

## Parallelization

- **Welle A (unabhängig):** T1, T2, T3 — je eine Datei, keine gemeinsamen Importe.
- **Welle B (nach A):** T4 → T5 (T5 nutzt T4 und T2/T3).
- **Welle C (nach B):** T6, T7 parallel; T8 danach; T9 zuletzt.

## AC-Deckung

| AC | Tasks |
|----|-------|
| AC-1 | T6, T8, T9 |
| AC-2 | T2, T5, T7 |
| AC-3 | T5, T8 |
| AC-4 | T1, T6 |
| AC-5 | T4, T5, T8 |
| AC-6 | T3, T5 |
| AC-7 | T8 (Server Component), Nachweis im E2E-Test |
| AC-8 | T7, T8 |
| AC-9 | T1, T6 |
| AC-10 | T2, T7 |
| EC-1 | T2, T7 |
| EC-2 | T6, T4 |
| EC-3 | T3 |
| EC-4 | T1, T4 |
| EC-5 | T2 |
