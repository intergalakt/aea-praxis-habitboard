# App Shell

_Struktur der Oberfläche, die vor dem ersten Feature steht. Owner: HAB-1 (Rahmen, Navigation,
geschützter Bereich). Spätere Features füllen Bereiche, sie bauen den Rahmen nicht neu._

## Layout-Decision

Eine App, ein Rahmen: Kopfzeile mit Produktname und Navigation, darunter der Seiteninhalt.
Öffentliche Seiten (Start, Wetter) und der geschützte Bereich teilen sich denselben Rahmen —
so bleibt der Wechsel zwischen „anschauen" und „arbeiten" ein Klick und es gibt keine zweite
Navigationslogik. Kein Sidebar, kein Dashboard-Grid als Grundgerüst; das wäre für drei Features
Struktur ohne Inhalt.

## Areas

| Bereich | Route | Zweck | Zugriff | Owner |
|---|---|---|---|---|
| Start | `/` | Kurze Erklärung, Einstieg zu Anmeldung und Wetter | öffentlich | HAB-1 |
| Wetter | `/wetter` | Aktuelles Wetter + Tagesvorhersage für einen Ort | öffentlich | HAB-2 |
| Anmelden | `/login` | E-Mail + Passwort anmelden | öffentlich (bereits Angemeldete → `/dashboard`) | HAB-1 |
| Registrieren | `/signup` | Konto anlegen | öffentlich (bereits Angemeldete → `/dashboard`) | HAB-1 |
| Dashboard | `/dashboard` | Eigene Gewohnheiten, Abhaken, Serie | **geschützt** | HAB-3 (Rahmen: HAB-1) |

## Navigation

- Kopfzeile: „HabitBoard" (Link `/`), „Wetter" (Link `/wetter`).
- Rechts in der Kopfzeile: **abgemeldet** → „Anmelden" und „Registrieren"; **angemeldet** →
  E-Mail des Nutzers und „Abmelden" (Server Action, danach `/`).
- Mobile: dieselben Links, umbrechend, keine Burger-Menü-Logik im MVP.

## Auth-Grenze

- `/dashboard` und alles darunter ist geschützt: `src/proxy.ts` prüft die Session und leitet
  abgemeldete Anfragen auf `/login?next=<pfad>` um. Ohne gültige Session sieht niemand
  Dashboard-Daten — die Prüfung passiert vor dem Rendern, nicht in der Komponente.
- Datenbankzugriff ist zusätzlich durch RLS geschützt: Selbst ein Fehler in der Oberfläche
  liefert keine fremden Zeilen.
- Fehlt die Supabase-Konfiguration ganz (keine Env-Werte), gilt „niemand ist angemeldet" —
  geschützte Routen leiten auf `/login` um und die Seite erklärt den Zustand, statt abzustürzen.

## Zustände

- **Laden:** pro Aktion ein sichtbarer „läuft"-Zustand am Button (abgehakt wird sofort optimistisch
  angezeigt, Fehler rollen zurück).
- **Leer:** Dashboard ohne Gewohnheiten zeigt eine Anleitung („Erste Gewohnheit anlegen") statt
  einer leeren Liste; Wetter ohne Ort zeigt die Suche.
- **Fehler:** Formularfehler erscheinen am Feld (Zod-Meldung auf Deutsch), Netz-/Serverfehler als
  Meldung über dem Formular. Die Wetterseite nennt bei Ausfall des Dienstes den Grund.
