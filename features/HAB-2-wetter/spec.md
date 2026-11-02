# HAB-2: Wetter-Integration

## Dependencies
- **HAB-1** (Konten & Login) — nicht technisch zwingend, aber die Seite hängt im selben App-Shell
  (Kopfzeile mit Navigation) und beerbt die dort definierten Sicherheits-Header. Die Wetter-Seite
  selbst bleibt **öffentlich**, ohne Anmeldung.

## User Stories
- Als Besucherin möchte ich ohne Konto sehen, wie das Wetter an meinem Ort ist, damit ich die Seite
  ausprobieren kann, bevor ich ein Konto anlege.
- Als Nutzerin, die morgens abhakt, möchte ich das Wetter meines Ortes direkt neben meinen
  Gewohnheiten sehen, damit ich weiß, ob die Lauf-Gewohnheit heute sinnvoll ist.
- Als Betreiber möchte ich keine API-Schlüssel verwalten und keine Nutzerdaten an Dritte schicken,
  damit Datenschutz und Betriebsaufwand klein bleiben.
- Als Betreiber möchte ich, dass die Seite bei einem Ausfall des Wetterdienstes nicht kaputt ist,
  damit ein fremder Ausfall nicht wie ein Fehler meiner App aussieht.

## Out of Scope
- **Stündliche Vorhersage, Niederschlagsradar, 14-Tage-Prognose** — die Tagesübersicht (heute max/min,
  aktuell) reicht für die Entscheidung „heute laufen oder nicht".
- **Standortbestimmung per Browser-Geolocation** — braucht eine Berechtigungsabfrage und liefert
  Koordinaten, die ich nicht speichern will; die Ortssuche ist explizit und datensparsam.
- **Gespeicherte Lieblingsorte pro Konto** — setzt Nutzdatentabellen voraus; das kommt mit HAB-3
  (`habits`), nicht hier. Der letzte Ort bleibt nur in der URL (`?ort=`), nicht in der Datenbank.
- **Wetter-Widgets auf dem Dashboard** — HAB-3 entscheidet, ob das Wetter dort eingebettet wird;
  dieses Feature liefert nur die eigenständige Seite `/wetter`.
- **Ein eigener Wetterdienst oder Fallback-Anbieter** — Open-Meteo ist kostenlos und schlüsselfrei;
  ein zweiter Anbieter wäre Aufwand ohne Nutzen im MVP.
- **Alarme, Push-Benachrichtigungen, Unwetterwarnungen** — kein Warnsystem ohne Haftungsfrage.

## Acceptance Criteria

- [ ] **AC-1** — Angenommen niemand ist angemeldet, wenn `/wetter` aufgerufen wird, dann antwortet die
  Seite mit HTTP 200 und einem Eingabefeld für den Ort, ohne Weiterleitung auf `/login`.
- [ ] **AC-2** — Angenommen jemand tippt einen Ortsnamen (mindestens 2 Zeichen) und sendet ab, wenn
  der Dienst einen Treffer liefert, dann zeigt die Seite den Ortsnamen mit Land, das aktuelle Wetter
  und die Tageswerte (Maximum/Minimum) für diesen Ort.
- [ ] **AC-3** — Angenommen der eingegebene Ort ist unbekannt, wenn abgesendet wird, dann erscheint die
  deutsche Meldung „Für diesen Ort wurden keine Daten gefunden." und der Server antwortet mit 200,
  nicht mit einem Fehlercode.
- [ ] **AC-4** — Angenommen die Eingabe ist leer, kürzer als 2 Zeichen oder länger als 80 Zeichen, wenn
  abgesendet wird, dann erscheint eine Feldfehlermeldung und es wird **keine** Anfrage an Open-Meteo
  ausgelöst.
- [ ] **AC-5** — Angenommen Open-Meteo antwortet nicht innerhalb von 3 Sekunden oder mit einem
  Fehlerstatus, wenn die Seite baut, dann erscheint „Wetterdaten sind gerade nicht erreichbar. Bitte
  später erneut versuchen." mit einer erneuten Lademöglichkeit — kein Stacktrace, kein 500.
- [ ] **AC-6** — Angenommen zwei Aufrufe für denselben Ort erfolgen innerhalb von 10 Minuten, wenn der
  zweite Aufruf die Seite lädt, dann wird die zweite Anfrage aus dem Zwischenspeicher bedient und
  **nicht** erneut an Open-Meteo gestellt.
- [ ] **AC-7** — Angenommen eine beliebige Seite der App wird im Browser geladen, dann findet **keine**
  Anfrage des Browsers an `api.open-meteo.com` statt; alle Wetterdaten holt der Server.
- [ ] **AC-8** — Angenommen Wetterdaten werden angezeigt, dann nennt die Seite die Quelle
  „Wetterdaten: Open-Meteo" mit Link auf `https://open-meteo.com/` und dem Hinweis CC BY 4.0
  (Lizenzbedingung der Daten).
- [ ] **AC-9** — Angenommen jemand ruft `/wetter?ort=` mit HTML/Script-Inhalt auf, wenn die Seite baut,
  dann wird die Eingabe als Text behandelt: sie erscheint nicht als Markup in der Antwort und wird
  nicht an Open-Meteo weitergegeben, wenn sie die Zeichenlängen nicht erfüllt.
- [ ] **AC-10** — Angenommen die Seite zeigt Wetter, dann sind alle Zeitangaben in der Zeitzone des
  gewählten Ortes (nicht in der Server-Zeitzone) und Temperaturen mit einer Nachkommastelle und
  Einheit °C beschriftet.

## Edge Cases
- **EC-1** — Mehrdeutige Ortsnamen („Springfield") liefern mehrere Treffer. Regel: der erste Treffer
  gewinnt, die Seite nennt zusätzlich Region und Land, damit klar ist, welcher Ort gemeint war.
- **EC-2** — Ortsnamen mit Umlauten und Akzenten („Zürich", „São Paulo"): die Suche geht als
  URL-kodierter Parameter raus, Umlaute bleiben erhalten; das Ergebnis zeigt den Namen so, wie
  Open-Meteo ihn liefert.
- **EC-3** — Zwei gleichzeitige Aufrufe für denselben Ort (Reload-Sturm): beide bekommen eine Antwort;
  der Zwischenspeicher verhindert, dass beide eine Upstream-Anfrage auslösen (Single-Flight über ein
  geteiltes Promise).
- **EC-4** — Open-Meteo liefert gültiges JSON, aber ohne `current`-Block (Schema-Abweichung): Zod
  lehnt die Antwort ab, es erscheint die Meldung aus AC-5 — kein `undefined` in der Oberfläche.
- **EC-5** — Datum der Vorhersage ist der lokale Tag des Ortes; bei Orten jenseits der Datumsgrenze
  (z. B. Kiritimati, UTC+14) zeigt die Seite den Tag, den Open-Meteo als `timezone=auto` liefert,
  nicht den UTC-Tag.

## Technical Requirements
- **Schnittstelle:** Open-Meteo Geocoding (`https://geocoding-api.open-meteo.com/v1/search`) und
  Forecast (`https://api.open-meteo.com/v1/forecast`) — ohne Schlüssel, ohne Konto, CC BY 4.0.
- **Datenschutz:** es werden nur Ortsnamen übertragen, keine Konto- oder Gerätekennungen; Koordinaten
  stehen nur in der URL des serverseitigen Aufrufs.
- **Qualitätsszenarien:** AC-5/AC-6 sind Verfügbarkeitszusagen (Timeout + Zwischenspeicher), AC-7 ist
  Datensparsamkeit (kein Fremd-Request aus dem Browser), AC-9 Eingabevalidierung (SEC-05).
- **Barrierefreiheit:** Suchfeld mit `<label>`, Statusmeldungen in einer Live-Region (`role="status"`),
  Temperaturwerte als Text, nicht nur als Farbe.
- **Testbarkeit:** die Formatierung (WMO-Code → deutsche Beschreibung, Temperatur, Ortszeit) und der
  Zwischenspeicher sind reine Module ohne Netz — sie werden mit Vitest geprüft; der Netzwerkzugriff
  wird in Tests injiziert, nie echt aufgerufen.

## Open Questions
- [x] Braucht Open-Meteo einen API-Key? **Nein** — kostenlos für nicht-kommerzielle Nutzung, Attribution
  Pflicht (AC-8).
- [x] Speichern wir den zuletzt gewählten Ort? **Nein, nicht in der Datenbank** — nur in der URL.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Öffentliche Seite ohne Anmeldung | Senkt die Einstiegshürde und macht das Feature unabhängig von HAB-1 testbar; es gibt keine personenbezogenen Daten. | 2026-11-02 |
| Nur Tageswerte statt Stundenraster | Für die Entscheidung „heute raus oder nicht" reicht max/min; weniger Fläche, weniger Fehlerquellen. | 2026-11-02 |
| Ortsuche statt Browser-Geolocation | Keine Berechtigungsabfrage, keine Koordinaten im Client, kein Datenschutzthema. | 2026-11-02 |
| Zwischenspeicher im Server-Speicher (10 Minuten) | Open-Meteo bittet um sparsame Nutzung; 10 Minuten sind für Tageswerte unkritisch und halten die Seite bei Last stabil. | 2026-11-02 |
| Fehlerzustand als eigener Text statt Retry-Schleife | Ein ehrlicher Hinweis ist besser als drei Versuche, die die Latenz verdreifachen. | 2026-11-02 |
