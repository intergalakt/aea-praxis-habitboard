/**
 * Quellenangabe für Open-Meteo (AC-8) — die Daten stehen unter CC BY 4.0,
 * deshalb verlinkt die Seite Anbieter und Lizenz sichtbar.
 * Als eigene Komponente, damit Board-Kopfzeile und Wetterseite dieselbe
 * Formulierung nutzen und die Lizenz nicht auseinanderläuft.
 */
export function WeatherAttribution() {
  return (
    <p className="text-xs text-muted-foreground">
      Wetterdaten von{" "}
      <a
        className="underline underline-offset-2 hover:text-foreground"
        href="https://open-meteo.com/"
        rel="noreferrer"
        target="_blank"
      >
        Open-Meteo
      </a>{" "}
      (CC BY 4.0). Abgerufen serverseitig, ohne Weitergabe von Nutzerdaten.
    </p>
  );
}
