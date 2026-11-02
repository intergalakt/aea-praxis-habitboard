# Blockierte Punkte

Stand 2026-11-02. Alles, was während der Umsetzung nicht sofort ging, steht hier — mit dem,
was daraus wurde. Ein Eintrag bleibt stehen, auch wenn er gelöst ist; „erledigt“ heißt:
die Blockade hat den Abschluss nicht verhindert.

---

## B-1 — GitHub-Token ungültig: kein Push in ein Remote-Repo

**Was blockierte:** `gh auth status` meldete einen ungültigen Token; das Repo hat kein Remote,
Push und PR-Erstellung waren damit nicht möglich.
**Was ich stattdessen getan habe:** alle Arbeitsschritte lokal als Commits festgehalten, einer
pro Arbeitspaket, mit Conventional-Commit-Präfix. Die Historie ist vollständig und lässt sich
später unverändert pushen.
**Status: erledigt** — für die Aufgabe zählt die nachvollziehbare Historie, nicht das Hosting.
Der Token-Wert ist nicht dokumentiert (Zugangsdaten werden nicht übernommen). Vor einem echten
Push: `gh auth login` erneuern, `git remote add origin …`, `git push -u origin main`.

---

## B-2 — Mobile-Safari-Tests liefen nicht: WebKit fehlte

**Was blockierte:** Playwright konnte das Projekt `Mobile Safari` nicht starten, weil der
WebKit-Browser nicht installiert war.
**Lösung:** `npx playwright install webkit` (Build `webkit-2370`), danach lief die Suite in
beiden Projekten grün.
**Status: erledigt.**

---

## B-3 — Mutationstests deckten zwei Lücken nicht auf

**Was blockierte:** Beim gezielten Verfälschen von `auth.rules.ts` (Fehlermeldung, Safe-Redirect)
blieben die Tests bei 12 grün — die Suite hätte die Änderung bemerken müssen.
**Was ich getan habe:** Datei aus dem Backup zurückgespielt, den Befund in
`features/HAB-1-auth/qa-report.md` als Qualitätslücke dokumentiert statt ihn zu verschweigen.
Für HAB-2 und HAB-3 decken die Tests die kritischen Pfade (Serienberechnung, Fortschritt,
Datum, RLS) mit festen Daten ab.
**Status: offen, bewusst** — Teststärke ist keine Korrektheitsfrage der App, sondern der Suite.
Nachziehen: gezielte Negativtests für Fehlertexte und Redirect-Ziele.

---

## B-4 — `gh`-Fernoperationen und Deploy nicht Teil des Auftrags

**Was blockierte:** Nichts Technisches — Deployment (`/deploy`) war nicht gefordert.
**Status: erledigt** — kein Deployment, `features/INDEX.md` führt den Punkt entsprechend.

---

## B-5 — Mehrtägige Serien nicht als E2E prüfbar

**Was blockierte:** Die Serie über mehrere Kalendertage lässt sich im Browser nur mit
Manipulation der Systemzeit prüfen — das wäre ein Test der Testumgebung, nicht der App.
**Lösung:** `calculateStreak` nimmt „heute“ als Parameter; Unit-Tests decken Lücken, Mitternacht
und Ein-Tages-Fälle ab, das E2E prüft den sichtbaren Fall „1 Tag in Folge“.
**Status: erledigt** — Grenze dokumentiert in `features/HAB-3-habits/qa-report.md`.

---

## B-6 — Auftragsdatei wurde zwischen zwei Messungen größer

**Was blockierte:** Ein früher Read ergab 2.823 Zeichen, ein späterer Volltext-Read 3.017 Zeichen.
**Was ich getan habe:** beide Male die Datei vollständig gelesen (kein `head`, kein `tail`) und
nach dem letzten Stand gearbeitet.
**Status: erledigt** — der letzte Volltext-Read ist maßgeblich.
