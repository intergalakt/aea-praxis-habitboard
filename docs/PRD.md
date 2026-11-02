# Product Requirements Document — HabitBoard

## Vision

HabitBoard ist ein bewusst kleines SaaS für Gewohnheiten: Wer eine neue Routine aufbauen will,
trägt sie ein, hakt sie täglich ab und sieht seinen Fortschritt als Serie. Das Produkt löst genau
ein Problem — „ich weiß nicht, ob ich diese Woche drangeblieben bin" — und sonst nichts. Es ist
als Praxisprojekt „Abschlussprüfung (Praxis)" des AI Engineering Accelerator entstanden und
demonstriert den vollständigen spec-getriebenen Workflow des AI Engineering Kits.

## Target Users

- **Einzelne Nutzerinnen und Nutzer**, die 1–5 Gewohnheiten gleichzeitig aufbauen (Sport, Lesen,
  Wasser trinken) und dafür keine überladene App mit Coach, Community und Abo wollen.
- **Menschen, die ihr Handy morgens kurz aufmachen**: Die Kernhandlung muss in unter zehn Sekunden
  erledigt sein — Liste sehen, abhaken, fertig.
- Kein Team-, Familien- oder Admin-Szenario; es gibt genau eine Rolle: angemeldeter Nutzer.

## Core Features (Roadmap)

Das MVP ist nutzbar, wenn ein Mensch sich registrieren, anmelden, seine eigenen Gewohnheiten
anlegen und täglich abhaken kann — und dabei niemand die Daten anderer sieht. Feature 1 liefert
Konto und geschützten Bereich, Feature 3 den eigentlichen Nutzen, Feature 2 eine kostenlose
externe Integration (Wetter), die den täglichen Blick auf die App belohnt. Bewusst später:
Erinnerungen per E-Mail, Statistiken über 30 Tage hinaus, Teilen, Mobile-App. Die vollständige
Feature-Map mit Reihenfolge steht in `features/INDEX.md`.

## Success Metrics

- **Aktivierung:** eine registrierte Person legt in der ersten Sitzung mindestens eine Gewohnheit an.
- **Tägliche Kernhandlung:** ein Abhaken pro aktivem Tag und Nutzer.
- **Stabilität:** `npm run check` (Lint, Typecheck, Struktur, Tests, Build) läuft grün durch.
- **Datenschutz:** kein Zugriff auf fremde Zeilen — durch RLS auf Datenbankebene erzwungen,
  nicht nur in der Oberfläche.

## Constraints

- **Budget: 0 €.** Supabase Free Tier, Open-Meteo ohne Schlüssel, GitHub Public Repository,
  kein Bezahldienst, keine Kreditkarte.
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, shadcn/ui, Supabase
  (PostgreSQL + Auth), Zod. Tests mit Vitest.
- **Supabase-Strategie: `single`.** Ein gehostetes Supabase-Projekt (Free) für Test und Live;
  Schemaänderungen liegen als `supabase/migrations/*.sql` im Repo und werden mit `supabase db push`
  eingespielt. Für die Entwicklung und die Qualitätssicherung läuft zusätzlich ein lokaler
  Supabase-Stack (Docker) — dort wurden Auth und RLS tatsächlich geprüft.
- **Secrets:** nur `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` (beide öffentlich
  bestimmbar, Schutz kommt von RLS). Keine Schlüssel im Repository; `.env.local.example` enthält
  Platzhalter, `.env.local` bleibt lokal.
- **Umfang:** drei Features, ein Entwickler (Agent), wenige Tage statt Wochen. Kein Deployment
  in dieser Prüfungsleistung (`/deploy` ist nicht Teil des Auftrags).

## Operating Conditions and Assumptions

- **Erwartete Nutzung:** einzelne Personen, 1–5 Gewohnheiten, einige Abhak-Vorgänge pro Tag.
  Datenmenge im Bereich hunderter Zeilen — keine Performance-Anforderung über „Seite lädt
  erkennbar schnell" hinaus.
- **Verbindung:** Online-Pflicht; keine Offline-Fähigkeit, kein Sync-Konflikt-Szenario.
- **Externe Abhängigkeit:** Open-Meteo (kostenlos, kein Schlüssel, Rate-Limit inakzeptabel hohe
  Grenzen für diesen Umfang). Fällt der Dienst aus, zeigt die Wetterseite eine verständliche
  Meldung, die App bleibt benutzbar — das ist eine Anforderung, keine Annahme.
- **Supabase Free Tier:** pausiert Projekte nach längerer Inaktivität. Für die Prüfung
  unkritisch, für einen echten Betrieb ein bekannter Vorbehalt.
- **Angenommen, nicht bestätigt:** Der Nutzer legt das Supabase-Projekt selbst an (E-Mail
  intergalakt@gmail.com) und trägt URL sowie anon key in `.env.local` ein. Bis das geschieht,
  laufen Auth und Datenzugriff ausschließlich gegen den lokalen Stack.

## Non-Goals

- Keine Erinnerungen, Push-Nachrichten oder E-Mails (kein Versand-Aufwand, keine Kosten).
- Keine Auswertungen/Diagramme außer der aktuellen Serie („Streak").
- Keine sozialen Funktionen: kein Teilen, keine Freunde, keine Ranglisten.
- Keine Rollen außer „angemeldet" — kein Admin-Backend, keine Moderationsoberfläche.
- Keine Zahlungen, keine Abos, kein Marketing-Funnel.
- Keine Mehrsprachigkeit: Oberfläche auf Deutsch, Code und Dokumente wie im Kit festgelegt.
