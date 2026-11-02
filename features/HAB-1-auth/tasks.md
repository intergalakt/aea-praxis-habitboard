# HAB-1 Tasks

> Spec: `spec.md` · Design: `design.md` · ein Arbeitspaket = ein Commit-Häppchen, Reihenfolge
> innerhalb einer Ebene ist verbindlich.

## Level 0 — Grundlagen (Env, Konfiguration)

- [x] T0a  `supabase/config.toml`: `minimum_password_length = 10`, `password_requirements =
      "lower_upper_letters_digits"`  · files: supabase/config.toml  · → AC-5
- [x] T0b  Sicherheits-Header in `next.config.ts`  · files: next.config.ts  · → AC-10
- [ ] T0c [user] — **offen**, nur für gehostetes Supabase relevant (lokal greift `minimum_password_length` aus `config.toml`)  Supabase (gehostet): Passwortrichtlinie 10 Zeichen + Klassen setzen  · where:
      Dashboard → Authentication → Sign In / Providers → Email  · → AC-5
- [ ] T0d [user] — **offen**, CAPTCHA ist lokal nicht aktiv (Drosselung in `auth.throttle.ts` deckt EC-5 lokal ab)  Supabase (gehostet): CAPTCHA (Turnstile) aktivieren  · where: Dashboard →
      Authentication → Attack Protection  · → EC-5, SEC-04

## Level 1 — Data / Schema

Keine Tabellen, keine Migration (Design → Data Model). Stattdessen die reinen Module:

- [x] T1 [P]  `auth.schema.ts` — Zod-Schemata für Registrierung/Anmeldung (Längen, Passwortklassen,
      deutsche Meldungen)  · files: src/features/auth/auth.schema.ts  · → AC-5, EC-4
- [x] T2 [P]  `auth.rules.ts` — `safeNextPath()`, `mapAuthError()`, `passwordPolicyErrors()`
      · files: src/features/auth/auth.rules.ts  · → AC-3, AC-4, EC-2
- [x] T3 [P]  `auth.throttle.ts` — gleitendes Fenster pro `email|ip`, 5/15 min, Sperre 15 min
      · files: src/features/auth/auth.throttle.ts  · → EC-5

## Level 2 — API (Server Actions + Proxy)

- [x] T4  `auth.hooks.ts` — `isAuthConfigured()`, `createServerClient()`, `getSessionUser()`
      · files: src/features/auth/auth.hooks.ts  · → AC-9, AC-8
- [x] T5  `signUpAction` (neutrale Meldung, Drosselung, Zod)  · files: src/features/auth/auth.actions.ts
      · → AC-1, AC-2
- [x] T6  `signInAction` (Drosselung → `signInWithPassword` → Redirect-Ziel aus `safeNextPath`)
      · files: src/features/auth/auth.actions.ts  · → AC-3, AC-4, EC-3, EC-5
- [x] T7  `signOutAction`  · files: src/features/auth/auth.actions.ts  · → AC-7
- [x] T8  `src/proxy.ts` — Matcher, Redirect-Logik, Cookie-Refresh  · files: src/proxy.ts  · → AC-6

## Level 3 — UI

- [x] T9  [P]  `LoginForm` (shadcn `Input`/`Label`/`Button`/`Alert`, Feld- und Formularfehler)
      · files: src/features/auth/components/login-form.tsx  · → AC-3, AC-4, AC-5, EC-3
- [x] T10 [P]  `SignupForm`  · files: src/features/auth/components/signup-form.tsx  · → AC-1, AC-2, AC-5
- [x] T11 [P]  `ConfigNotice` + `LogoutButton`  · files: src/features/auth/components/config-notice.tsx,
      logout-button.tsx  · → AC-9, AC-7
- [x] T12  Seiten `/login`, `/signup` im `(auth)`-Layout  · files: src/app/(auth)/login/page.tsx,
      src/app/(auth)/signup/page.tsx, src/app/(auth)/layout.tsx  · → AC-1, AC-3, AC-9
- [x] T13  `ProtectedLayout` mit `getUser()`-Prüfung und Kopfzeile  · files:
      src/app/(protected)/layout.tsx  · → AC-8, AC-6
- [x] T14  `/dashboard`-Startseite (Platzhalter für HAB-3)  · files:
      src/app/(protected)/dashboard/page.tsx  · → AC-8
- [x] T15  Startseite: Links auf Anmelden/Registrieren/Wetter  · files: src/app/page.tsx  · → AC-6

## Parallelization

- **Welle A (unabhängig):** T1, T2, T3 — je eine eigene Datei, keine gemeinsamen Importe.
- **Welle B (nach A):** T4 → T5, T6, T7 (gleiche Datei `auth.actions.ts` → **nicht** parallel) → T8.
- **Welle C (nach B):** T9, T10, T11 parallel (verschiedene Dateien); T12–T15 danach seriell.

## AC-Deckung

| AC | Tasks |
|----|-------|
| AC-1 | T5, T10, T12 |
| AC-2 | T5, T10 |
| AC-3 | T2, T6, T9 |
| AC-4 | T2, T6, T9 |
| AC-5 | T0a, T0c, T1, T9, T10 |
| AC-6 | T8, T13, T15 |
| AC-7 | T7, T11, T13 |
| AC-8 | T4, T13, T14 |
| AC-9 | T4, T11, T12 |
| AC-10 | T0b |
| EC-1 | T6 |
| EC-2 | T2, T6 |
| EC-3 | T6, T9 |
| EC-4 | T1 |
| EC-5 | T3, T5, T6, T0d |
