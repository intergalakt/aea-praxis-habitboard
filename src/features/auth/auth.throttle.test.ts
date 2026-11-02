import { beforeEach, describe, expect, it } from "vitest";

import {
  checkAttempt,
  clearFailures,
  recordFailure,
  resetThrottle,
  throttleKey,
} from "./auth.throttle";

const T0 = 1_700_000_000_000;

describe("auth.throttle", () => {
  beforeEach(() => {
    resetThrottle();
  });

  it("sperrt nach fünf Fehlversuchen (EC-5)", () => {
    const key = throttleKey("Test@Example.ORG", "203.0.113.7");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(checkAttempt(key, T0).allowed).toBe(true);
      recordFailure(key, T0);
    }
    const gate = checkAttempt(key, T0);
    expect(gate.allowed).toBe(false);
    expect(gate.retryAfterSeconds).toBe(900);
  });

  it("trennt Zähler nach E-Mail und IP", () => {
    const key = throttleKey("a@example.org", "203.0.113.7");
    for (let attempt = 0; attempt < 5; attempt += 1) recordFailure(key, T0);

    expect(checkAttempt(key, T0).allowed).toBe(false);
    expect(checkAttempt(throttleKey("b@example.org", "203.0.113.7"), T0).allowed).toBe(true);
    expect(checkAttempt(throttleKey("a@example.org", "198.51.100.9"), T0).allowed).toBe(true);
  });

  it("gibt nach Ablauf der Sperre wieder frei", () => {
    const key = throttleKey("a@example.org", "203.0.113.7");
    for (let attempt = 0; attempt < 5; attempt += 1) recordFailure(key, T0);

    expect(checkAttempt(key, T0 + 900_001).allowed).toBe(true);
  });

  it("löscht Zähler nach erfolgreicher Anmeldung", () => {
    const key = throttleKey("a@example.org", "203.0.113.7");
    recordFailure(key, T0);
    recordFailure(key, T0);
    clearFailures(key);
    for (let attempt = 0; attempt < 4; attempt += 1) recordFailure(key, T0);
    expect(checkAttempt(key, T0).allowed).toBe(true);
  });
});
