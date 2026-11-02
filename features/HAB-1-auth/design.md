# HAB-1 — Tech Design

> Spec: `features/HAB-1-auth/spec.md` · Stack: Next.js 16 (App Router) + Supabase Auth ·
> Arbeitspakete: `tasks.md` im selben Ordner.

## Component Structure

| Component | Responsibility | ACs |
|-----------|----------------|-----|
| `src/proxy.ts` (`proxy`, Matcher `/dashboard/:path*`, `/login`, `/signup`) | Erste Verteidigungslinie: Session-Cookie lesen, geschützte Routen ohne Identität umleiten, angemeldete von `/login`/`/signup` wegschicken | AC-6, EC-2 |
| `ProtectedLayout` (`src/app/(protected)/layout.tsx`) | Zweite, autoritative Prüfung mit `supabase.auth.getUser()`; Header mit Navigation + Abmelden | AC-8 |
| `LoginForm` | E-Mail/Passwort, Zod-Feldfehler, Server-Action-Aufruf, neutrale Fehlermeldung | AC-3, AC-4, AC-5, EC-3, EC-5 |
| `SignupForm` | Registrierung mit derselben Validierung, neutrale Erfolgsmeldung | AC-1, AC-2, AC-5 |
| `logoutAction` | `auth.signOut()` + Cookie-Löschung + Redirect `/` | AC-7 |
| `ConfigNotice` | Hinweis „Anmeldung ist nicht konfiguriert", wenn Env fehlt/Platzhalter | AC-9 |
| `next.config.ts` → `headers()` | Sicherheits-Header für alle Antworten | AC-10 |

## Code Structure

```
src/features/auth/
  auth.schema.ts      # Zod: email, password, credentials — pure
  auth.rules.ts       # pure: safeNextPath(), passwordPolicyErrors() — pure
  auth.rules.test.ts  # Unit-Tests (von /qa)
  auth.throttle.ts    # In-Memory-Drossel (Map), Server-only
  auth.hooks.ts       # Server-Helfer: isAuthConfigured(), getSessionUser()
  auth.actions.ts     # 'use server': signUpAction, signInAction, signOutAction
  components/
    login-form.tsx
    signup-form.tsx
    logout-button.tsx
    config-notice.tsx
src/app/(auth)/login/page.tsx
src/app/(auth)/signup/page.tsx
src/app/(protected)/layout.tsx
src/app/(protected)/dashboard/page.tsx
src/proxy.ts
```

`.schema.ts`/`.rules.ts` bleiben frei von Next-/Supabase-Imports (dependency-cruiser: pure Module
dürfen nur `zod` und Typen importieren), damit sie ohne Netz und ohne Server testbar sind.

## Footprint
- **Neue Abhängigkeiten:** keine (`zod`, `@supabase/ssr`, `@supabase/supabase-js`, shadcn sind da).
- **Neue Dateien:** 15 (siehe oben).
- **Geänderte Dateien:** `next.config.ts` (Header), `src/app/page.tsx` (Links auf Login/Wetter),
  `.env.local.example` (Kommentar zur Herkunft der Werte), `supabase/config.toml` (Passwortrichtlinie).
- **Neue Umgebungsvariablen:** keine — `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`
  existieren bereits; SEC-01: Werte nie ausgeben, nur Namen dokumentieren.

## Quality and Failure Behavior

| AC | Verhalten bei Erfolg | Verhalten bei Fehler | Beobachtbar als |
|----|----------------------|----------------------|-----------------|
| AC-1/AC-2 | 303 auf `/login` + Erfolgshinweis im Query-Parameter `?registered=1` | Supabase-Fehler → gleiche neutrale Meldung; Log ohne Credentials | HTML der Login-Seite enthält Hinweis |
| AC-3 | 303 auf `/dashboard` oder gültiges `?next=` | Fehler → 200 mit Formular + Meldung | `Location`-Header, Cookie `sb-…-auth-token` in `Set-Cookie` |
| AC-4 | — | identischer Text, kein Cookie | Rumpf-Vergleich zweier Fehlerfälle |
| AC-5 | Request an Supabase | Feldfehler, **kein** Netzaufruf | Formular-HTML, keine Session |
| AC-6 | 200 für `/`, `/wetter` | 307 → `/login?next=…` | `curl -I` |
| AC-8 | 200 mit Inhalt | 307, kein Markup der Seite | Direktaufruf mit gefälschtem Cookie |
| AC-9 | 200 | kein 500, sondern Hinweistext; `/dashboard` bleibt zu | Server-Log ohne Stacktrace, HTML-Hinweis |
| AC-10 | Header vorhanden | — | `curl -I /` |

Zusicherung Drosselung (EC-5): Zustand im Prozessspeicher, gleitendes Fenster; 5 Fehlversuche pro
`email|ip` in 15 min, Sperre 15 min. Eine zweite Instanz hätte eigene Zähler — bewusste Entscheidung
(siehe unten), weil ohne Service-Role-Key keine serverseitige Persistenz möglich ist, die ein
Angreifer nicht selbst zurücksetzen könnte.

## Data Model
- **Keine neuen Tabellen.** Identität liegt in `auth.users` (von Supabase verwaltet, nicht von uns
  beschrieben). Keine Nutzdaten in diesem Feature → keine RLS-Policies hier; `habits`/`habit_entries`
  mit Policies kommen mit HAB-3 (`docs/data-model.md`).

## Behaviors & Access

| Behavior | Wer darf es | Durchgesetzt in |
|----------|-------------|-----------------|
| Registrieren | jeder (öffentlich) | Server Action + Zod + Supabase `signUp` |
| Anmelden | jeder (öffentlich) | Server Action + Zod + Supabase `signInWithPassword` |
| `/dashboard` lesen | nur angemeldete Person | `proxy.ts` **und** `ProtectedLayout` (`getUser()`) |
| Abmelden | angemeldete Person | Server Action, `auth.signOut()` löscht Cookie serverseitig |
| Fehlversuche | max. 5 pro E-Mail+IP/15 min | `auth.throttle.ts` vor jedem `signIn`-Aufruf |

## Dependencies
Intern: keine. Extern: `@supabase/ssr` (Cookie-Handling), `zod` (Validierung), `next` (Headers/Proxy).
Reihenfolge: dieses Feature zuerst — HAB-2 und HAB-3 liefern in den hier gebauten Rahmen.

## Settings the user makes

| Setting | Wo | Vorschlag | Warum (AC) | Wann |
|---------|----|-----------|-----------|------|
| Passwort-Mindestlänge 10 + Klassen `lower_upper_letters_digits` | Dashboard → Authentication → Sign In / Providers → Email (lokal: `[auth]` in `config.toml`, hier gesetzt) | wie links | AC-5 (Server-Gegenprobe zur Formularprüfung) | `now` — lokal erledigt, im gehosteten Projekt vom Nutzer zu setzen |
| Rate Limits (Sign-in/Sign-up, E-Mail) auf Standard belassen | Dashboard → Authentication → Rate Limits | Standard | EC-5 (Grundschutz per IP unter der App-Drossel) | `now` |
| E-Mail-Bestätigung einschalten | Dashboard → Authentication → Sign In / Providers → Email → „Confirm email" | **an** | EC-1 (gehosteter Betrieb ohne Bestätigung = fremde Adressen anmeldbar) | `go-live` (lokaler Betrieb braucht keinen Mailserver) |
| CAPTCHA (Cloudflare Turnstile) auf Login/Signup | Dashboard → Authentication → Attack Protection (lokal `[auth.captcha]`) | **an**, sobald Turnstile-Keys vorliegen | SEC-04 — Bot-Schutz gegen automatisiertes Durchprobieren | `now` — **offen**, Keys fehlen (siehe `docs/bericht.md` → Offene Punkte) |
| Leaked-Password-Schutz | Dashboard → Authentication → Attack Protection | an, falls Plan es hergibt (kostenpflichtig) | AC-5 Ergänzung | `go-live` — Kostenentscheidung des Nutzers |

## Technical Decisions

1. **Zwei Prüfschichten statt einer** — `proxy.ts` ist Komfort und billige Abweisung, `ProtectedLayout`
   ruft `getUser()` selbst. Grund: Middleware-Matcher sind konfigurierbar und damit fehlbar; die
   Autorisierung darf nicht an einer Regex hängen (SEC-03, AC-8).
2. **`getUser()` statt `getSession()`** — `getSession()` liest das Cookie, ohne es zu prüfen;
   `getUser()` validiert beim Auth-Server. Kosten: ein Netzaufruf pro geschütztem Rendering, im
   lokalen Stack wenige Millisekunden.
3. **Neutrale Antwort auf Registrierung** — bewusst kein „E-Mail bereits vergeben" (AC-2).
   Trade-off: leicht schlechtere UX (ein Klick mehr), dafür keine Enumeration.
4. **Drosselung im Speicher, nicht in der Datenbank** — ohne Service-Role-Key (der nie ins Repo
   darf, SEC-01) gibt es keine Tabelle, die ein anonymer Angreifer nicht selbst zurücksetzen könnte;
   ein RPC zum Zurücksetzen wäre die Umgehung gleich mitgeliefert. Also: Map im Serverprozess,
   Trade-off dokumentiert (skaliert nicht über Instanzen), Review-Trigger: zweite Instanz oder
   horizontale Skalierung → Umzug in Redis/Upstash.
5. **Fehlermeldungen gemappt statt durchgereicht** — Supabase-Texte („Email not confirmed",
   „Invalid login credentials") werden auf zwei deutsche Sätze abgebildet; nur der Bestätigungsfall
   bekommt einen eigenen Text, weil er nach korrektem Passwort auftritt (EC-1).
6. **Sicherheits-Header in `next.config.ts`** — nicht im Host, damit sie auch lokal und in jedem
   Deploy-Ziel gelten (AC-10, SEC-06). CSP folgt bewusst nicht hier: Next.js-Inline-Skripte bräuchten
   Nonce-Infrastruktur, das ist ein eigenes Feature.
7. **`?next=` per Allowlist** — nur Pfade, die mit genau einem `/` beginnen, keine `//`, keine
   Backslashes: `safeNextPath()` (pure, getestet).

## Open Questions
- [x] In-Memory-Drosselung akzeptabel für ein Ein-Instanz-MVP? **Ja**, mit Review-Trigger (Entscheidung 4).
- [x] CAPTCHA jetzt? **Nein** — Keys fehlen; als offene Nutzer-Aufgabe geführt, nicht als erledigt behauptet.
