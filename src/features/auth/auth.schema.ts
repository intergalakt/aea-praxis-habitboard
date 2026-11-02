import { z } from "zod";

/**
 * E-Mail: getrimmt, kleingeschrieben, maximal 254 Zeichen (RFC-Praxis).
 * Die Prüfung auf gültige Form läuft zuletzt, damit die Fehlermeldungen in
 * verständlicher Reihenfolge erscheinen.
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Bitte gib deine E-Mail-Adresse ein.")
  .max(254, "Die E-Mail-Adresse ist zu lang.")
  .toLowerCase()
  .pipe(z.email("Das ist keine gültige E-Mail-Adresse."));

/** Passwortrichtlinie: 10 Zeichen, Groß, Klein, Ziffer (spec.md AC-5). */
export const passwordSchema = z
  .string()
  .min(10, "Das Passwort braucht mindestens 10 Zeichen.")
  .max(200, "Das Passwort ist zu lang.")
  .regex(/[a-z]/, "Es fehlt ein Kleinbuchstabe.")
  .regex(/[A-Z]/, "Es fehlt ein Großbuchstabe.")
  .regex(/[0-9]/, "Es fehlt eine Ziffer.");

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = credentialsSchema;
export const signUpSchema = credentialsSchema;

export type Credentials = z.infer<typeof credentialsSchema>;

/** Feldbezogene Fehlermeldungen aus einem Zod-Ergebnis, ohne interne Pfade. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
