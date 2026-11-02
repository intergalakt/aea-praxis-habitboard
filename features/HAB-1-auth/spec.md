# HAB-1: Konten & Login

## Dependencies
- None (Fundament: alle weiteren Features setzen den geschützten Bereich voraus)

## User Stories
- Als neue Nutzerin möchte ich mich mit E-Mail und Passwort registrieren, damit meine Gewohnheiten
  an mein Konto gebunden sind und nicht an dieses Gerät.
- Als wiederkehrender Nutzer möchte ich mich anmelden und direkt meine Seite sehen, damit das
  Abhaken morgens keine Umwege kostet.
- Als angemeldeter Nutzer möchte ich mich abmelden können, damit ein geteiltes Gerät meine Daten
  nicht preisgibt.
- Als Betreiber möchte ich, dass niemand ohne Anmeldung an geschützte Seiten kommt, damit ein
  Fehler in der Oberfläche nicht automatisch ein Datenleck ist.

## Out of Scope
- **Passwort-Reset und „Passwort vergessen"** — braucht E-Mail-Versand (Kosten, SMTP-Konfiguration);
  verschoben auf P1, als eigenes Feature.
- **Eigene Nutzdaten-Tabellen und deren Policies** — `habits` und `habit_entries` entstehen mit
  HAB-3; dieses Feature legt keine Domänentabellen an.
- **Profilseite, Avatar, Anzeigename** — es gibt genau eine Identität (E-Mail), nichts zu pflegen.
- **OAuth-Anbieter (Google, GitHub), Magic Links, Passkeys** — zusätzliche Konfiguration ohne
  Nutzen für ein Ein-Personen-MVP.
- **Rollen, Admin-Backend, Nutzerverwaltung** — eine Rolle: angemeldet.
- **E-Mail-Bestätigung als Pflicht im Testbetrieb** — lokal ist sie aus (kein Mailserver); im
  gehosteten Betrieb wird sie eingeschaltet (Einstellung des Nutzers), das Verhalten dafür ist
  Edge Case EC-1.

## Acceptance Criteria

- [ ] **AC-1** — Angenommen eine nicht angemeldete Person ist auf `/signup`, wenn sie eine gültige
  E-Mail-Adresse und ein Passwort eingibt und absendet, dann wird ein Konto angelegt und eine
  neutrale Erfolgsmeldung erscheint, die zur Anmeldung führt — unabhängig davon, ob die Adresse
  schon existierte.
- [ ] **AC-2** — Angenommen die E-Mail-Adresse gehört bereits zu einem Konto, wenn jemand sie erneut
  zur Registrierung absendet, dann erscheint **dieselbe** Meldung wie bei einer neuen Adresse, es
  entsteht kein zweites Konto und die Antwort enthält keinen Hinweis auf die Existenz des Kontos.
- [ ] **AC-3** — Angenommen eine Person gibt auf `/login` E-Mail und korrektes Passwort ein, wenn sie
  absendet, dann ist sie angemeldet (Session-Cookie gesetzt) und wird auf `/dashboard` geleitet —
  oder auf das interne Ziel aus `?next=`, sofern es mit `/` beginnt und nicht `//` enthält.
- [ ] **AC-4** — Angenommen jemand gibt ein falsches Passwort oder eine unbekannte E-Mail-Adresse
  ein, wenn er absendet, dann erscheint in beiden Fällen wortgleich „E-Mail oder Passwort ist
  falsch." und es wird keine Session gesetzt.
- [ ] **AC-5** — Angenommen ein Passwort hat weniger als 10 Zeichen oder enthält nicht mindestens
  einen Großbuchstaben, einen Kleinbuchstaben und eine Ziffer, wenn das Formular abgesendet wird,
  dann erscheint eine deutsche Feldfehlermeldung und es wird **keine** Anfrage an Supabase
  ausgelöst.
- [ ] **AC-6** — Angenommen niemand ist angemeldet, wenn `/dashboard` aufgerufen wird, dann antwortet
  der Server mit einer Weiterleitung auf `/login?next=%2Fdashboard`; `/` und `/wetter` bleiben ohne
  Anmeldung mit HTTP 200 erreichbar.
- [ ] **AC-7** — Angenommen eine Person ist angemeldet, wenn sie „Abmelden" betätigt, dann ist die
  Session beendet, das Session-Cookie ist ungültig und ein anschließender Aufruf von `/dashboard`
  leitet auf `/login` um.
- [ ] **AC-8** — Angenommen jemand ruft eine geschützte Seite ohne gültige Session auf, wenn der
  Seitenaufbau läuft, dann prüft **auch** die Seite selbst die Identität serverseitig
  (`supabase.auth.getUser()`), nicht nur die Middleware — eine Umgehung der Middleware liefert
  keinen Inhalt, sondern die Weiterleitung.
- [ ] **AC-9** — Angenommen die Supabase-Konfiguration fehlt oder enthält Platzhalter, wenn `/login`
  oder `/dashboard` aufgerufen wird, dann erscheint eine verständliche deutsche Meldung („Anmeldung
  ist nicht konfiguriert") statt eines Serverfehlers, und geschützte Routen bleiben geschlossen.
- [ ] **AC-10** — Angenommen der Server liefert eine beliebige HTML-Antwort, dann enthält sie die
  Header `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` und
  `X-Frame-Options: DENY` (Klickjacking-Schutz), gesetzt in der App-Konfiguration, nicht im Host.

## Edge Cases
- **EC-1** — Was passiert bei aktiver E-Mail-Bestätigung (gehosteter Betrieb)? Die Registrierung
  erzeugt noch keine Session; die Seite erklärt „Konto angelegt — bitte bestätige die E-Mail".
  Ein Anmeldeversuch vor der Bestätigung endet mit einer eigenen Meldung („Bitte bestätige zuerst
  deine E-Mail-Adresse"), nicht mit „falsches Passwort".
- **EC-2** — Was passiert bei `?next=https://evil.example` oder `?next=//evil.example`? Das Ziel wird
  verworfen, es geht auf `/dashboard` — kein offener Redirect.
- **EC-3** — Was passiert, wenn Supabase nicht antwortet oder 429 liefert? Die Seite zeigt „Anmeldung
  ist gerade nicht möglich. Bitte später erneut versuchen." und setzt keine Session; der Fehler wird
  serverseitig geloggt (ohne Passwort, ohne Token).
- **EC-4** — Was passiert bei sehr langer Eingabe (E-Mail > 254 Zeichen, Passwort > 200 Zeichen)?
  Zod begrenzt beide Längen und meldet am Feld; nichts wird abgesendet.
- **EC-5** — Was passiert bei wiederholten Fehlversuchen? Ab dem 6. Fehlversuch für dieselbe
  Kombination aus E-Mail und Client-IP innerhalb von 15 Minuten wird für 15 Minuten blockiert —
  mit derselben Meldung wie AC-4, damit die Sperre nicht verrät, ob das Konto existiert.

## Technical Requirements
- **Qualitätsszenarien:** AC-6 und AC-8 sind Sicherheits-Zusagen (SEC-03), AC-4/EC-5 betreffen
  Kredit-Missbrauch (SEC-04), AC-10 Header (SEC-06), AC-2 Nicht-Enthüllung (SEC-04).
  Betriebsannahme: eine Instanz des Next-Servers (siehe `design.md` → Technical Decisions zur
  Drosselung im Speicher).
- **Barrierefreiheit:** beide Formulare mit `<label>`, Feldfehler über `aria-describedby` verknüpft,
  Absenden per Tastatur möglich.
- **Browser:** aktuelle Chrome/Firefox/Safari-Versionen, keine Altlasten.

## Open Questions
- [x] Wird die E-Mail-Bestätigung im Testbetrieb verlangt? **Nein** — lokal aus, im gehosteten
  Betrieb durch den Nutzer einzuschalten; Verhalten in EC-1 beschrieben.
- [x] Braucht das MVP Passwort-Reset? **Nein** — out of scope, P1.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Registrierung zeigt eine neutrale Meldung statt „E-Mail bereits vergeben" | Verhindert Konto-Enumeration; der Preis (ein Klick mehr zur Anmeldung) ist im MVP vertretbar. | 2026-11-02 |
| Kein Passwort-Reset im MVP | Reset braucht Mailversand (Kosten, SMTP, Deliverability) — nicht mit Budget 0 und ohne eigenen Mailserver zuverlässig. | 2026-11-02 |
| Mindestlänge 10 Zeichen + Groß/Klein/Ziffer | Über Supabase-Minimum (6) und über gängigen Empfehlungen für neue Konten; kein Zeichensalat-Zwang. | 2026-11-02 |
| Abmelden als Server Action mit Weiterleitung auf `/` | Kein Client-State, kein Flackern; Cookie wird serverseitig ungültig. | 2026-11-02 |
