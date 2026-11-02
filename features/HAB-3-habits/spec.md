# HAB-3: Habit-Tracker

## Dependencies
- **HAB-1 (Konten & Login)** — technisch zwingend: jede Seite dieses Features liegt hinter dem
  Login, alle Daten hängen an `auth.users.id`, und die Mandantentrennung baut auf der
  Identität aus HAB-1 auf. Ohne Anmeldung gibt es keinen Nutzer, dem eine Gewohnheit gehören kann.
- **Data Model** — `docs/data-model.md` beschreibt `habits` und `habit_entries` bereits
  (Felder, Constraints, `unique (habit_id, entry_date)`); dieses Feature setzt das Modell per
  Migration um und ändert es nicht.

## User Stories
- Als angemeldeter Nutzer möchte ich eine Gewohnheit mit einem Namen anlegen, damit ich sie ab
  morgen täglich abhaken kann.
- Als jemand, der morgens drei Dinge erledigen will, möchte ich meine Gewohnheiten als Liste sehen,
  damit ich ohne Suchen weiß, was heute noch offen ist.
- Als Nutzer möchte ich eine Gewohnheit mit einem Klick als „heute erledigt“ markieren — und den
  Klick zurücknehmen können, weil ich mich vertippt habe.
- Als Nutzer möchte ich sehen, wie viele Tage in Folge ich dran war, damit ich die Serie nicht
  versehentlich reiße.
- Als Nutzer möchte ich eine Gewohnheit löschen, die ich nicht mehr verfolgen will — inklusive
  ihrer Einträge, ohne dass Reste zurückbleiben.
- Als Nutzer möchte ich sicher sein, dass niemand sonst meine Gewohnheiten sieht oder abhaken kann,
  auch nicht über direkte Anfragen an die Datenbank.

## Out of Scope
- **Wiederkehrende Details wie „3× pro Woche“, Zielzahlen, Einheiten** — eine Gewohnheit ist im
  MVP binär: an einem Tag erledigt oder nicht.
- **Erinnerungen, Push-Nachrichten, E-Mail-Digest** — braucht Versandinfrastruktur (Kosten, SMTP);
  verschoben auf P1.
- **Statistikseiten, Diagramme, Monatskalender, Export** — die Serie und „heute erledigt“ reichen
  für den Nutzen; Auswertungen sind ein eigenes Feature.
- **Bearbeiten des Namens** — Anlegen und Löschen genügen im MVP; ein Tippfehler wird durch
  Löschen und Neuanlegen korrigiert.
- **Reihenfolge per Drag & Drop** — die Liste ist nach `created_at` sortiert, stabil und erklärbar.
- **Mehrere Nutzer pro Konto, Teilen, Teams** — eine Identität, ein Board.
- **Zeitzone pro Nutzer** — `entry_date` ist der Kalendertag des Servers (siehe Data Model).

## Acceptance Criteria

### AC-1: Anlegen einer Gewohnheit
Angemeldete Nutzer legen auf `/dashboard` über ein Formularfeld „Neue Gewohnheit“ eine Gewohnheit
an. Nach dem Absenden erscheint sie ohne Neuladen der Seite in der Liste. Der Name wird getrimmt;
er muss nach dem Trimmen 1–80 Zeichen lang sein und darf nicht nur aus Leerzeichen bestehen.

### AC-2: Abhaken für heute
Jede Gewohnheit in der Liste hat eine Schaltfläche „Heute erledigt“. Ein Klick markiert die
Gewohnheit für den heutigen Tag: Die Zeile zeigt sichtbar „heute erledigt“, und ein zweiter Klick
auf dieselbe Schaltfläche („Erledigt zurücknehmen“) entfernt die Markierung wieder. Beide
Richtungen sind ohne Seitenwechsel möglich.

### AC-3: Doppeltes Abhaken erzeugt keinen zweiten Eintrag
Wird derselbe Tag für dieselbe Gewohnheit mehrfach markiert — etwa durch Doppelklick oder zwei
offene Tabs —, bleibt es bei genau einem Eintrag (`unique (habit_id, entry_date)`); die Anzeige
ist danach identisch zu einem einzelnen Klick. Es entsteht kein Fehlerdialog.

### AC-4: Tagesliste zeigt den Stand von heute
Die Liste zeigt für jede Gewohnheit, ob sie heute erledigt ist, und eine Zusammenfassung
„X von Y heute erledigt“ oberhalb der Liste. Die Zahlen ändern sich unmittelbar nach jedem
Abhaken oder Zurücknehmen.

### AC-5: Serie (Streak) wird berechnet, nicht gespeichert
Pro Gewohnheit zeigt die Zeile die aktuelle Serie in Tagen: die Anzahl aufeinanderfolgender
erledigter Kalendertage, die heute oder gestern endet. Ein Tag ohne Eintrag beendet die Serie —
eine Serie von gestern bleibt sichtbar (Toleranz für „heute noch nicht abgehakt“), eine Lücke
von zwei Tagen setzt sie auf 0. Es gibt kein Zählerfeld in der Datenbank.

### AC-6: Löschen entfernt Gewohnheit und Einträge
Die Zeile bietet „Löschen“ mit Rückfrage („Gewohnheit und alle Einträge löschen?“). Nach dem
Bestätigen verschwindet die Gewohnheit sofort aus der Liste; ihre `habit_entries` sind
mitgelöscht (`ON DELETE CASCADE`), es bleiben keine Waisen zurück.

### AC-7: Leerzustand erklärt den nächsten Schritt
Ohne Gewohnheiten zeigt `/dashboard` statt einer leeren Fläche einen Text, der zum Anlegen
auffordert („Noch keine Gewohnheit — leg oben die erste an.“), plus das Formular aus AC-1.

### AC-8: Fremde Daten sind unerreichbar (RLS)
Auf `habits` und `habit_entries` ist Row Level Security aktiv, jede Policy verlangt
`user_id = auth.uid()` für SELECT, INSERT, UPDATE und DELETE. Ein Abruf mit der Sitzung von
Nutzer B liefert für die Zeilen von Nutzer A **null** Zeilen — lesend wie schreibend; der Versuch,
eine fremde Gewohnheit zu löschen, ändert nichts.

### AC-9: Ungültige Eingaben werden verständlich abgewiesen
Ein leerer oder zu langer Name (über 80 Zeichen, nach Trimmen) wird mit einer deutschen Meldung
abgewiesen, ohne dass ein Datensatz entsteht. Ein Eintrag mit `entry_date` in der Zukunft wird
von der Datenbank abgelehnt (Check-Constraint), die Oberfläche bietet solche Daten nicht an.

### AC-10: Geschützter Bereich, deutsche Oberfläche
`/dashboard` ist ohne Sitzung nicht erreichbar: Der Aufruf leitet auf `/login?next=/dashboard` um.
Alle sichtbaren Texte, Fehlermeldungen und Datumsangaben sind deutsch; die Seite funktioniert ohne
JavaScript (Formular-Absenden per POST, anschließend Weiterleitung).

## Edge Cases

### EC-1: Sehr viele Gewohnheiten
Die Liste bleibt bei 50 Gewohnheiten bedienbar (scrollbar, keine abgeschnittenen Schaltflächen);
die Reihenfolge ist stabil nach `created_at`.

### EC-2: Abhaken an einem neuen Kalendertag
Ein Eintrag von gestern bleibt gestern. Wird die Seite nach Mitternacht neu geladen, gilt die
Gewohnheit als „heute offen“, die Serie bleibt aber erhalten (AC-5), solange gestern erledigt war.

### EC-3: Zwei Tabs, gleiche Gewohnheit
Zwei parallele Abhak-Vorgänge führen zu genau einem Eintrag. Der zweite Vorgang ist ein No-Op,
kein Fehler; nach dem Neuladen zeigen beide Tabs denselben Stand.

### EC-4: Datenbank nicht erreichbar
Ist Supabase nicht erreichbar, zeigt die Seite eine deutsche Fehlermeldung („Gewohnheiten konnten
nicht geladen werden.“) und bleibt bedienbar; ein Abhak-Versuch erzeugt keine falsche
Erfolgsmeldung.

### EC-5: Umlaute, Emoji und lange Wörter im Namen
Namen mit Umlauten, Emoji oder einem 60-Zeichen-Einzelwort werden gespeichert und unverändert
angezeigt (kein Abschneiden in der Datenbank, Umbruch in der Oberfläche statt Überlauf).

## Technical Requirements

- **Datenzugriff:** ausschließlich serverseitig über den Supabase-Client der App; der
  `service_role`-Key wird nicht verwendet, damit RLS für jede Anfrage gilt.
- **Migration:** `supabase/migrations/<timestamp>_habits.sql` legt beide Tabellen, Constraints,
  Indizes und Policies an — versioniert im Repo, nicht von Hand in der Konsole.
- **Schichtung:** reine Regeln (Serienberechnung, Validierung) getrennt von Datenzugriff und
  Oberfläche, damit die Serienlogik ohne Datenbank testbar ist.
- **Keine Secrets:** es kommen keine neuen Umgebungsvariablen hinzu; `.env.local` bleibt
  unverändert.
- **Sprache:** Oberfläche, Fehlermeldungen und Datumsformate deutsch (`de-DE`).

## Open Questions
- _keine offen_ — die Produktentscheidungen unten sind mit dem Auftraggeber abgestimmt.

## Decision Log

### Product Decisions
- **Binäre Gewohnheit statt Zielzahlen:** „erledigt oder nicht“ ist in einem Klick bedienbar und
  in einer Spec ohne Ambiguität prüfbar; Zielzahlen („8 Gläser Wasser“) verschieben das Feature in
  Richtung Tracking-App und wurden verworfen.
- **Serie berechnet statt gespeichert:** ein gespeicherter Zähler veraltet bei Korrekturen und
  braucht Reparaturläufe; die Berechnung aus `entry_date` ist immer korrekt und testbar.
- **Serie überlebt den heutigen Tag:** die Toleranz „endet heute oder gestern“ verhindert, dass
  morgens alle Serien auf 0 stehen und Nutzer die App als kaputt erleben.
- **Löschen mit Rückfrage, kein Archiv:** die App ist ein Ein-Personen-MVP; ein Soft-Delete wäre
  eine zusätzliche Zustandsvariable ohne Nutzen.
- **Kein Bearbeiten des Namens:** seltener Fall, und Löschen-plus-Neuanlegen ist ein klarer,
  bereits getesteter Pfad — Bearbeiten wäre ein eigener AC-Zweig ohne Produktnutzen im MVP.
