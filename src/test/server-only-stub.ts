/**
 * Stub für das `server-only`-Guard-Paket in Unit-Tests.
 *
 * Das echte Paket wirft beim Import außerhalb einer Server-Komponente. In Vitest
 * (jsdom) prüfen wir Server-Module (Service, Client, Cache) aber direkt — deshalb
 * wird das Paket in `vitest.config.mts` auf diese leere Datei gemappt.
 */
export {};
