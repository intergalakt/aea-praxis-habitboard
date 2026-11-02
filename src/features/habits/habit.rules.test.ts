import { describe, expect, it } from "vitest";

import {
  addDays,
  calculateStreak,
  formatProgress,
  formatStreak,
  summarizeToday,
  toIsoDate,
  uniqueDates,
} from "./habit.rules";

const TODAY = "2026-11-02";

describe("addDays / toIsoDate", () => {
  it("rechnet über Monatsgrenzen", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
  });

  it("rechnet über Jahres- und Schaltjahresgrenzen", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("liefert für einen Zeitpunkt den UTC-Kalendertag", () => {
    expect(toIsoDate(new Date("2026-11-02T23:30:00Z"))).toBe("2026-11-02");
  });
});

describe("calculateStreak (AC-5)", () => {
  it("zählt heute und die Vortage zusammen", () => {
    const dates = ["2026-11-02", "2026-11-01", "2026-10-31"];
    expect(calculateStreak(dates, TODAY)).toBe(3);
  });

  it("bleibt bei Serie, wenn heute noch offen ist (EC-2)", () => {
    const dates = ["2026-11-01", "2026-10-31", "2026-10-30"];
    expect(calculateStreak(dates, TODAY)).toBe(3);
  });

  it("ist 0, wenn heute und gestern fehlen", () => {
    expect(calculateStreak(["2026-10-30"], TODAY)).toBe(0);
  });

  it("bricht an einer Lücke ab", () => {
    const dates = ["2026-11-02", "2026-11-01", "2026-10-30", "2026-10-29"];
    expect(calculateStreak(dates, TODAY)).toBe(2);
  });

  it("ist 0 ohne Einträge", () => {
    expect(calculateStreak([], TODAY)).toBe(0);
  });

  it("zählt Duplikate nicht doppelt", () => {
    const dates = ["2026-11-02", "2026-11-02", "2026-11-01"];
    expect(calculateStreak(dates, TODAY)).toBe(2);
  });

  it("übersteht Monats- und Jahreswechsel", () => {
    const dates = ["2027-01-01", "2026-12-31", "2026-12-30"];
    expect(calculateStreak(dates, "2027-01-01")).toBe(3);
  });

  it("zählt über den Schalttag hinweg", () => {
    const dates = ["2028-03-01", "2028-02-29", "2028-02-28"];
    expect(calculateStreak(dates, "2028-03-01")).toBe(3);
  });

  it("ignoriert Einträge in der Zukunft", () => {
    const dates = ["2026-11-05", "2026-11-02", "2026-11-01"];
    expect(calculateStreak(dates, TODAY)).toBe(2);
  });
});

describe("formatStreak", () => {
  it("formuliert Singular, Plural und Leerfall deutsch", () => {
    expect(formatStreak(0)).toBe("Noch keine Serie");
    expect(formatStreak(1)).toBe("1 Tag in Folge");
    expect(formatStreak(7)).toBe("7 Tage in Folge");
  });
});

describe("summarizeToday / formatProgress (AC-4)", () => {
  const habits = [
    { entryDates: ["2026-11-02"] },
    { entryDates: ["2026-11-01"] },
    { entryDates: [] },
  ];

  it("zählt erledigte Gewohnheiten von heute", () => {
    expect(summarizeToday(habits, TODAY)).toEqual({ done: 1, total: 3 });
  });

  it("formuliert die Zusammenfassung und den Leerzustand", () => {
    expect(formatProgress({ done: 1, total: 3 })).toBe("1 von 3 heute erledigt");
    expect(formatProgress({ done: 0, total: 0 })).toBe("Noch keine Gewohnheit angelegt.");
  });
});

describe("uniqueDates", () => {
  it("entfernt Duplikate und sortiert absteigend", () => {
    expect(uniqueDates(["2026-11-01", "2026-11-02", "2026-11-01"])).toEqual([
      "2026-11-02",
      "2026-11-01",
    ]);
  });
});
