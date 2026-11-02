import { describe, expect, it } from "vitest";

import { habitIdSchema, habitTitleSchema } from "./habit.schema";

const UUID = "3f2b8c1e-9a44-4d6f-8f0e-1c2d3e4f5a6b";

describe("habitTitleSchema", () => {
  it("trimmt Leerraum am Rand", () => {
    expect(habitTitleSchema.parse("  Sport  ")).toBe("Sport");
  });

  it("weist einen leeren Namen mit deutscher Meldung ab", () => {
    const result = habitTitleSchema.safeParse("");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Bitte gib deiner Gewohnheit einen Namen.");
  });

  it("weist einen Namen aus reinen Leerzeichen ab (AC-9)", () => {
    expect(habitTitleSchema.safeParse("    ").success).toBe(false);
  });

  it("akzeptiert genau 80 Zeichen, aber nicht 81", () => {
    expect(habitTitleSchema.safeParse("a".repeat(80)).success).toBe(true);
    const tooLong = habitTitleSchema.safeParse("a".repeat(81));
    expect(tooLong.success).toBe(false);
    expect(tooLong.error?.issues[0].message).toBe("Der Name darf höchstens 80 Zeichen lang sein.");
  });

  it("zählt Emoji als ein Zeichen (EC-5)", () => {
    expect([...habitTitleSchema.parse("🏃".repeat(80))]).toHaveLength(80);
    expect(habitTitleSchema.safeParse("🏃".repeat(81)).success).toBe(false);
  });

  it("lässt Umlaute unverändert (EC-5)", () => {
    expect(habitTitleSchema.parse("Zähneputzen für Müde")).toBe("Zähneputzen für Müde");
  });
});

describe("habitIdSchema", () => {
  it("akzeptiert eine UUID", () => {
    expect(habitIdSchema.parse(UUID)).toBe(UUID);
  });

  it("weist leere und manipulierte IDs ab", () => {
    expect(habitIdSchema.safeParse("").success).toBe(false);
    expect(habitIdSchema.safeParse("../../etc/passwd").success).toBe(false);
    expect(habitIdSchema.safeParse("1 or 1=1").success).toBe(false);
  });
});
