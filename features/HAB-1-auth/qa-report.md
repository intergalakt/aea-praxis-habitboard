# QA Test Results — HAB-1 Konten & Login

**Getestet:** 2026-11-02
**App-URL:** `http://localhost:3000` (`probe.baseUrl`; Supabase lokal auf `http://127.0.0.1:54321`)
**Tester:** QA Engineer (KI)
**Umfang:** `full` — erster QA-Lauf für dieses Feature

> Legende: `[x]` in diesem Lauf verifiziert (Beleg nötig) · `[ ] BUG` als fehlerhaft verifiziert · `[!] NICHT VERIFIZIERT` in diesem Lauf nicht prüfbar (Grund nötig)

### Acceptance Criteria Status

#### AC-1: Registrierung legt Konto an, neutrale Meldung
- [x] Konto wird angelegt, Weiterleitung auf `/login?registered=1` mit Erfolgsmeldung — Beleg: `tests/hab-1-auth.spec.ts` („AC-1: Registrierung führt zur Anmeldung", chromium + Mobile Safari grün)
- [x] Kein Konto-Enumeration-Text in der Antwort — Beleg: `src/features/auth/auth.rules.ts:20` (eine Konstante für beide Fälle) + AC-2-Test

#### AC-2: Doppelte Registrierung verrät nichts
- [x] Zweite Registrierung derselben Adresse zeigt dieselbe Meldung, kein zweites Konto — Beleg: `tests/hab-1-auth.spec.ts` („AC-2/AC-3"), GoTrue-Log `user_repeated_signup 422` bei zweitem POST

#### AC-3: Anmeldung führt ins Board oder auf `?next=`
- [x] Login mit korrektem Passwort setzt Session und leitet auf `/dashboard` — Beleg: `tests/hab-1-auth.spec.ts` („AC-2/AC-3")
- [x] `?next=` wird nur für interne Ziele benutzt, `//host` und `https://…` verworfen — Beleg: `src/features/auth/auth.rules.ts:11-12`, Tests `safeNextPath` (3 Tests)

#### AC-4: Falsches Passwort und unbekannte Adresse sind nicht unterscheidbar
- [x] Beide Fälle zeigen wortgleich „E-Mail oder Passwort ist falsch.", keine Session — Beleg: `tests/hab-1-auth.spec.ts` („AC-4: falsches Passwort bleibt generisch"), `auth.rules.ts:20`

#### AC-5: Passwort-Policy im Formular, ohne Supabase-Anfrage
- [x] &lt;10 Zeichen oder fehlende Zeichenklasse wird am Feld gemeldet, keine Anfrage — Beleg: `tests/hab-1-auth.spec.ts` („AC-5: schwaches Passwort wird im Formular abgefangen"), `auth.rules.test.ts > passwordPolicyErrors` (2 Tests), Server-Policy zusätzlich in `supabase/config.toml` (`minimum_password_length = 10`, `password_requirements = "lower_upper_letters_digits"`)

#### AC-6: Geschützte Route ohne Session
- [x] `/dashboard` ohne Session → HTTP 307 auf `/login?next=%2Fdashboard` — Beleg: `curl -s -o /dev/null -w "%{http_code}" localhost:3000/dashboard` → `307`, Test „AC-6: ohne Sitzung kein Zugriff auf das Board"
- [x] `/` ohne Anmeldung → HTTP 200 — Beleg: `curl -w "root:%{http_code}"` → `200`
- [ ] BUG (niedrig, dokumentiert statt behoben): `/wetter` liefert derzeit `404`, weil die Route erst mit HAB-2 entsteht — die Zusage „`/wetter` bleibt öffentlich erreichbar" ist damit noch nicht prüfbar; sie wird in HAB-2 nachgezogen (siehe BUG-2)

#### AC-7: Abmelden beendet die Session
- [x] Abmelden löscht Session, `/dashboard` leitet danach auf `/login` — Beleg: `tests/hab-1-auth.spec.ts` („AC-7: Abmelden beendet die Sitzung")

#### AC-8: Seite prüft Identität zusätzlich selbst
- [x] Geschützte Seite ruft serverseitig `supabase.auth.getUser()` und leitet ohne Nutzer um — Beleg: `src/features/auth/auth.hooks.ts:45` (Guard in `src/app/(protected)/layout.tsx`) + `src/proxy.ts:53` (vorgelagerte Prüfung)

#### AC-9: Fehlende Konfiguration ergibt deutsche Meldung
- [x] Erkennung von Platzhaltern/leeren Werten — Beleg: `auth.rules.test.ts > isAuthConfigured` (2 Tests)
- [!] NICHT VERIFIZIERT: Laufzeitverhalten bei tatsächlich fehlender Konfiguration — dafür müsste der Dev-Server ohne Supabase-Env neu gestartet werden; das hätte die parallele E2E-Suite ungültig gemacht. Der E2E-Test „AC-9" prüft nur den umgekehrten Fall (konfigurierte Umgebung zeigt keinen Hinweis).

#### AC-10: Sicherheits-Header aus der App-Konfiguration
- [x] `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` — Beleg: `curl -sI localhost:3000/login | grep -i …` (alle drei vorhanden), gesetzt in `next.config.ts`

### Edge Cases Status

#### EC-1: Aktive E-Mail-Bestätigung
- [x] Unbestätigte Adresse bekommt eigene Meldung statt „falsches Passwort" — Beleg: `auth.rules.test.ts > mapAuthError > erkennt unbestätigte Adressen`
- [!] NICHT VERIFIZIERT: echter Lauf mit eingeschalteter Bestätigung (lokal kein Mailserver)

#### EC-2: Offener Redirect über `?next=`
- [x] `?next=https://evil.example` und `//evil.example` fallen auf `/dashboard` zurück — Beleg: `auth.rules.test.ts > safeNextPath > blockt offene Redirects (EC-2)`

#### EC-3: Supabase antwortet nicht oder mit 429
- [x] 429/Netzfehler werden als „Anmeldung ist gerade nicht möglich…" gemappt, keine Session — Beleg: `auth.rules.test.ts > mapAuthError > meldet Drosselung als vorübergehend`, `auth.actions.ts` (Fehlerpfad ohne Cookie-Setzen)
- [!] NICHT VERIFIZIERT: echter Ausfall (Supabase gestoppt) während eines Formularabsends

#### EC-4: Überlange Eingaben
- [x] E-Mail &gt;254 und Passwort &gt;200 Zeichen werden von Zod abgewiesen — Beleg: `src/features/auth/auth.schema.ts`, `auth.rules.test.ts`

#### EC-5: Wiederholte Fehlversuche
- [x] Ab dem 6. Fehlversuch je E-Mail+IP für 15 Minuten gesperrt, gleiche Meldung wie AC-4 — Beleg: `auth.throttle.test.ts` (4 Tests), Einbindung in `auth.actions.ts`

### Security Audit Results

- [x] Authentifizierung: ohne Login kein Zugriff — Beleg: `curl /dashboard` → 307, `src/proxy.ts`, `src/app/(protected)/layout.tsx`
- [x] Autorisierung: keine fremden Daten erreichbar — Beleg: HAB-1 legt keine Domänentabellen an; RLS für `habits`/`habit_entries` folgt mit HAB-3
- [x] Eingabevalidierung: XSS/Injection — Beleg: Zod-Schemas vor jeder Aktion (`auth.schema.ts`), React-Escaping, keine `dangerouslySetInnerHTML`-Vorkommen (`grep -r dangerouslySetInnerHTML src` → keine Treffer)
- [x] Ratenbegrenzung: eigene Drosselung greift — Beleg: `auth.throttle.test.ts`
- [x] Brute-Force: nach 5 Fehlversuchen gesperrt — Beleg: `auth.throttle.test.ts > sperrt nach fünf Fehlversuchen (EC-5)`
- [x] Kein Konto-Enumeration: identische Meldung für unbekannte Adresse und falsches Passwort — Beleg: AC-4-Test, `auth.rules.ts:20`
- [x] Keine Zugangsdaten in der URL nach dem Absenden — Beleg: beide Formulare senden per Server Action (`src/features/auth/components/login-form.tsx:23`, `signup-form.tsx:18`), Felder im Request-Body; keine `GET`-Formulare (`grep -rn "<form" src` → 3 Treffer, alle mit `action={…Action}`)
- [x] Keine Secrets im Client-Bundle — Beleg: `SERVICE_ROLE_KEY` aus `supabase status -o env` gegen `.next/static` gegrept → 0 Treffer; im Client nur `NEXT_PUBLIC_*`

### E2E Tests
- [x] Registrierung → Anmeldung → Board → Abmelden (AC-1, AC-2, AC-3, AC-4, AC-5, AC-7, AC-9, AC-10) — `tests/hab-1-auth.spec.ts` — 9 Tests × 2 Projekte (Chromium, Mobile Safari) = **18/18 grün**
- [x] Zugriff ohne Sitzung (AC-6) — gleiche Datei

**Roter Lauf (Testgüte):** `auth.rules.ts` (Guard `//` entfernt) und `auth.throttle.ts` (`MAX_FAILURES` auf 99) mutiert → `npx vitest run src/features/auth` → **3 Tests rot** (EC-2, EC-5 ×2). Nach Wiederherstellung wieder **16/16 grün**. Die Tests können also fehlschlagen.

### Nicht in diesem Lauf verifiziert

- [!] Firefox und echtes Safari — nur Chromium und WebKit (Mobile-Safari-Profil) installiert
- [!] Viewports 768 px / 1440 px im Detail — WebKit läuft mit Telefon-Viewport (390 px), Chromium mit Desktop-Default; ein reiner Tablet-/Desktop-Vergleich fehlt
- [!] Browser-Konsole und Netzwerk-Tab — kein DevTools-Zugriff im Testlauf
- [!] Laufzeitverhalten ohne Supabase-Konfiguration (AC-9) — siehe oben
- [!] Passwort-Reset, OAuth, Profilseite — per Spec out of scope, nicht getestet

### Bugs Found

#### BUG-1: Registrierung setzte sofort eine Session und brach die dokumentierte Weiterleitung
- **Severity:** Medium
- **Status:** Fixed (2026-11-02, re-verifiziert)
- **Klasse:** Auth-Flow weicht vom Spec-Vertrag ab (lokale Konfiguration ohne E-Mail-Bestätigung)
- **Control / AC:** AC-1
- **Sweep:** `grep -rn "signUp" src` — 1 Treffer (`auth.actions.ts`), behoben
- **Schritte:** 1. `/signup` öffnen 2. gültige Daten absenden 3. Erwartet: `/login?registered=1` 4. Tatsächlich: Proxy leitete wegen vorhandener Session direkt auf `/dashboard`
- **Fix:** nach erfolgreichem `signUp` wird die Session verworfen (`auth.actions.ts`), damit die Anmeldung explizit passiert — deckt sich mit EC-1 im gehosteten Betrieb

#### BUG-2: `/wetter` existiert noch nicht (öffentliche Route aus AC-6)
- **Severity:** Low
- **Status:** Deferred (wird mit HAB-2 geliefert, dort erneut geprüft)
- **Klasse:** Feature-Abhängigkeit über Feature-Grenze
- **Control / AC:** AC-6
- **Sweep:** `curl -o /dev/null -w "%{http_code}" localhost:3000/wetter` → `404`

#### BUG-3: Zwei E2E-Tests waren zu streng formuliert (Locator-Kollision, versteckter Text)
- **Severity:** Low
- **Status:** Fixed (2026-11-02, re-verifiziert)
- **Klasse:** Testfehler, kein Produktfehler — Next.js Route-Announcer hat ebenfalls `role="alert"`, E-Mail-Text war auf Mobil ausgeblendet
- **Control / AC:** AC-1, AC-2, AC-7 (Testinfrastruktur)
- **Fix:** Alert über Text gefiltert, E-Mail über die sichtbare Zeile „Angemeldet als …" geprüft; `signUp`-Helper wartet jetzt auf `registered=1`, damit kein `goto` eine laufende Server Action abbricht

### Summary
- **Acceptance Criteria:** 9/10 bestanden, 1 nicht (AC-6 Teilzusage `/wetter` → BUG-2 deferred), 1 Teilprüfung nicht verifiziert (AC-9 Laufzeit)
- **Bugs gefunden:** 3 (0 kritisch, 0 hoch, 1 mittel, 2 niedrig) — Offen: 0, Deferred: 1
- **Security:** 8/8 Prüfungen verifiziert
- **Production Ready:** JA (kein Critical/High offen; BUG-2 ist eine Erwartung an HAB-2, keine Sicherheitslücke)
- **Empfehlung:** Feature abnehmen; `/wetter`-Zusage in HAB-2 nachziehen
