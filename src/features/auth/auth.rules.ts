/**
 * Reine Regeln: keine Next-, Supabase- oder Netz-Importe.
 * Alles hier ist ohne Server und ohne Datenbank testbar (siehe auth.rules.test.ts).
 */

/** Nur interne, einteilig beginnende Pfade — kein offener Redirect (EC-2). */
export function safeNextPath(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (value.length === 0 || value.length > 512) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  if (value.includes("://")) return fallback;
  // Steuerzeichen und Backslashes sind in einem Pfad nie legitim.
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}

export const GENERIC_CREDENTIALS_MESSAGE = "E-Mail oder Passwort ist falsch.";
export const EMAIL_NOT_CONFIRMED_MESSAGE =
  "Bitte bestätige zuerst deine E-Mail-Adresse.";
export const TEMPORARY_FAILURE_MESSAGE =
  "Anmeldung ist gerade nicht möglich. Bitte später erneut versuchen.";

/**
 * Supabase-Fehler auf zwei Sätze abbilden (AC-4, EC-1, EC-3).
 * Unbekannte Fälle werden bewusst generisch — nie den Provider-Text durchreichen.
 */
export function mapAuthError(input: {
  code?: string | null;
  message?: string | null;
  status?: number | null;
}): string {
  const code = (input.code ?? "").toLowerCase();
  const message = (input.message ?? "").toLowerCase();
  const status = input.status ?? 0;

  if (status === 429 || code.includes("rate_limit") || message.includes("rate limit")) {
    return TEMPORARY_FAILURE_MESSAGE;
  }
  if (code === "email_not_confirmed" || message.includes("not confirmed")) {
    return EMAIL_NOT_CONFIRMED_MESSAGE;
  }
  if (
    code === "invalid_credentials" ||
    code === "invalid_grant" ||
    message.includes("invalid login credentials")
  ) {
    return GENERIC_CREDENTIALS_MESSAGE;
  }
  if (code === "user_already_exists" || code === "email_exists") {
    // Wird von der Registrierung bewusst nicht nach außen gegeben (AC-2).
    return "";
  }
  return GENERIC_CREDENTIALS_MESSAGE;
}

/** Passwortrichtlinie als Liste von Meldungen — für Formular und Tests. */
export function passwordPolicyErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10) errors.push("Das Passwort braucht mindestens 10 Zeichen.");
  if (password.length > 200) errors.push("Das Passwort ist zu lang.");
  if (!/[a-z]/.test(password)) errors.push("Es fehlt ein Kleinbuchstabe.");
  if (!/[A-Z]/.test(password)) errors.push("Es fehlt ein Großbuchstabe.");
  if (!/[0-9]/.test(password)) errors.push("Es fehlt eine Ziffer.");
  return errors;
}

/**
 * "Konfiguriert" heißt: URL ist eine echte http(s)-URL und der Key ist kein
 * Platzhalter aus .env.local.example (AC-9).
 */
export function isAuthConfigured(
  url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
): boolean {
  if (!url || !anonKey) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (!parsed.hostname) return false;
  const key = anonKey.trim();
  if (key.length < 30) return false;
  if (/your[_-]|placeholder|example|xxx/i.test(key)) return false;
  return true;
}
