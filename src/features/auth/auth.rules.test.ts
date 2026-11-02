import { describe, expect, it } from "vitest";

import {
  GENERIC_CREDENTIALS_MESSAGE,
  EMAIL_NOT_CONFIRMED_MESSAGE,
  TEMPORARY_FAILURE_MESSAGE,
  isAuthConfigured,
  mapAuthError,
  passwordPolicyErrors,
  safeNextPath,
} from "./auth.rules";

describe("safeNextPath", () => {
  it("lässt interne Pfade durch", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/dashboard?tab=woche")).toBe("/dashboard?tab=woche");
  });

  it("fällt bei fehlendem Wert auf das Dashboard zurück", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });

  it("blockt offene Redirects (EC-2)", () => {
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(safeNextPath("/dashboard\r\nX-Test: 1")).toBe("/dashboard");
    expect(safeNextPath("./relativ")).toBe("/dashboard");
  });
});

describe("mapAuthError", () => {
  it("nennt falsche Zugangsdaten generisch (AC-4)", () => {
    expect(mapAuthError({ code: "invalid_credentials" })).toBe(
      GENERIC_CREDENTIALS_MESSAGE,
    );
    expect(mapAuthError({ message: "Invalid login credentials" })).toBe(
      GENERIC_CREDENTIALS_MESSAGE,
    );
  });

  it("erkennt unbestätigte Adressen", () => {
    expect(mapAuthError({ code: "email_not_confirmed" })).toBe(
      EMAIL_NOT_CONFIRMED_MESSAGE,
    );
  });

  it("meldet Drosselung als vorübergehend (EC-3)", () => {
    expect(mapAuthError({ status: 429 })).toBe(TEMPORARY_FAILURE_MESSAGE);
  });

  it("verschweigt bestehende Konten (AC-2)", () => {
    expect(mapAuthError({ code: "user_already_exists" })).toBe("");
  });

  it("reicht nie fremde Fehlertexte durch", () => {
    const leaked = mapAuthError({ message: "duplicate key value violates unique constraint" });
    expect(leaked).toBe(GENERIC_CREDENTIALS_MESSAGE);
  });
});

describe("passwordPolicyErrors", () => {
  it("akzeptiert ein policy-konformes Passwort", () => {
    expect(passwordPolicyErrors("Gewohnheit2026")).toEqual([]);
  });

  it("sammelt jeden Verstoß (AC-5)", () => {
    const errors = passwordPolicyErrors("kurz");
    expect(errors.length).toBeGreaterThanOrEqual(3);
    expect(errors.join(" ")).toContain("10 Zeichen");
  });
});

describe("isAuthConfigured", () => {
  it("erkennt Platzhalter (AC-9)", () => {
    expect(isAuthConfigured(undefined, undefined)).toBe(false);
    expect(
      isAuthConfigured("http://127.0.0.1:54321", "your-anon-key-placeholder-value"),
    ).toBe(false);
    expect(isAuthConfigured("keine-url", "a".repeat(40))).toBe(false);
  });

  it("akzeptiert echte Werte", () => {
    expect(isAuthConfigured("http://127.0.0.1:54321", "a".repeat(200))).toBe(true);
  });
});
