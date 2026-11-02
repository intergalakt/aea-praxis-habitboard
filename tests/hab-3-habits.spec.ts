import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "Gewohnheit2026";

function freshEmail(): string {
  return `board-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.org`;
}

async function signUp(page: Page, email: string) {
  await page.goto("/signup");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Konto anlegen" }).click();
  await expect(page).toHaveURL(/registered=1/);
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Registriert einen frischen Nutzer und landet angemeldet auf dem Board. */
async function freshBoard(page: Page): Promise<string> {
  const email = freshEmail();
  await signUp(page, email);
  await signIn(page, email);
  return email;
}

async function addHabit(page: Page, title: string) {
  await page.getByLabel("Neue Gewohnheit").fill(title);
  await page.getByRole("button", { name: "Anlegen" }).click();
  await expect(page.getByText(title)).toBeVisible();
}

test("AC-7: leeres Board zeigt den Leerzustand", async ({ page }) => {
  await freshBoard(page);
  await expect(page.getByText("Noch keine Gewohnheiten")).toBeVisible();
});

test("AC-1/AC-2: Gewohnheit anlegen und abhaken", async ({ page }) => {
  await freshBoard(page);
  await addHabit(page, "10 Minuten lesen");

  await expect(page.getByText("0 von 1 heute erledigt")).toBeVisible();
  await page.getByRole("button", { name: "Abhaken" }).click();
  await expect(page.getByText("1 von 1 heute erledigt")).toBeVisible();
  await expect(page.getByText("Heute erledigt ·")).toBeVisible();

  // AC-3: Zurücknehmen entfernt den Eintrag wieder.
  await page.getByRole("button", { name: "Zurücknehmen" }).click();
  await expect(page.getByText("0 von 1 heute erledigt")).toBeVisible();
});

test("AC-4: nach dem Abhaken steht eine Serie von 1 Tag", async ({ page }) => {
  await freshBoard(page);
  await addHabit(page, "Wasser trinken");
  await page.getByRole("button", { name: "Abhaken" }).click();
  await expect(page.getByText("1 Tag in Folge")).toBeVisible();
});

test("AC-9: leerer Name wird abgelehnt und gemeldet", async ({ page }) => {
  await freshBoard(page);
  // `required` greift im Browser; die Server-Validierung wird über ein
  // Leerzeichen als einzigen Inhalt geprüft (besteht HTML-Validierung nicht).
  await page.getByLabel("Neue Gewohnheit").fill("   ");
  await page.getByRole("button", { name: "Anlegen" }).click();
  await expect(page).toHaveURL(/fehler=name/);
  await expect(page.getByText("Bitte gib einen Namen mit 1 bis 80 Zeichen ein.")).toBeVisible();
});

test("AC-6: Löschen entfernt die Gewohnheit vom Board", async ({ page }) => {
  await freshBoard(page);
  await addHabit(page, "Kurz spazieren");
  await page.getByRole("button", { name: "Kurz spazieren löschen" }).click();
  await expect(page.getByText("Noch keine Gewohnheiten")).toBeVisible();
});

test("AC-10: Anlegen und Abhaken funktionieren ohne JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await freshBoard(page);

  await addHabit(page, "Ohne Skript");
  await page.getByRole("button", { name: "Abhaken" }).click();
  await expect(page.getByText("1 von 1 heute erledigt")).toBeVisible();

  await context.close();
});

test("AC-8: fremde Gewohnheiten sind unsichtbar", async ({ page, browser }) => {
  await freshBoard(page);
  await addHabit(page, "Nur für mich");

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await freshBoard(otherPage);

  await expect(otherPage.getByText("Noch keine Gewohnheiten")).toBeVisible();
  await expect(otherPage.getByText("Nur für mich")).toHaveCount(0);
  await other.close();
});
