import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "Gewohnheit2026";

function freshEmail(): string {
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.org`;
}

async function signUp(page: Page, email: string, password: string = PASSWORD) {
  await page.goto("/signup");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Konto anlegen" }).click();
}

async function signIn(page: Page, email: string, password: string = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Anmelden" }).click();
}

test("AC-1: Registrierung führt zur Anmeldung", async ({ page }) => {
  const email = freshEmail();
  await signUp(page, email);

  await expect(page).toHaveURL(/\/login\?registered=1/);
  await expect(page.getByText("Konto angelegt")).toBeVisible();
});

test("AC-2/AC-3: Anmeldung führt ins geschützte Board", async ({ page }) => {
  const email = freshEmail();
  await signUp(page, email);
  await expect(page).toHaveURL(/registered=1/);

  await signIn(page, email);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dein Board" })).toBeVisible();
  await expect(page.getByText(email).first()).toBeVisible();
});

test("AC-2: doppelte Registrierung verrät nicht, dass das Konto existiert", async ({ page }) => {
  const email = freshEmail();
  await signUp(page, email);
  await expect(page).toHaveURL(/registered=1/);

  await signUp(page, email);
  await expect(page).toHaveURL(/registered=1/);
  await expect(page.getByText("existiert bereits")).toHaveCount(0);
});

test("AC-4: falsches Passwort bleibt generisch", async ({ page }) => {
  const email = freshEmail();
  await signUp(page, email);

  await signIn(page, email, "FalschesPasswort2026");
  const alert = page.locator("[role=alert]").filter({ hasText: "E-Mail oder Passwort ist falsch." });
  await expect(alert).toBeVisible();
  await expect(page.locator("[role=alert]").filter({ hasText: "Invalid login credentials" })).toHaveCount(0);
  await expect(page).toHaveURL(/\/login/);
});

test("AC-5: schwaches Passwort wird im Formular abgefangen", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("E-Mail").fill(freshEmail());
  await page.getByLabel("Passwort").fill("kurz");
  await page.getByRole("button", { name: "Konto anlegen" }).click();

  await expect(page.getByText("mindestens 10 Zeichen")).toBeVisible();
  await expect(page).toHaveURL(/\/signup/);
});

test("AC-6: ohne Sitzung kein Zugriff auf das Board", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();
});

test("AC-7: Abmelden beendet die Sitzung", async ({ page }) => {
  const email = freshEmail();
  await signUp(page, email);
  await signIn(page, email);
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("button", { name: "Abmelden" }).click();
  await expect(page).toHaveURL(/^http:\/\/[^/]+\/$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("AC-10: Sicherheits-Header liegen an", async ({ request }) => {
  const response = await request.get("/login");
  const headers = response.headers();

  expect(response.status()).toBe(200);
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("AC-9: konfigurierte Umgebung zeigt keinen Konfigurationshinweis", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Anmeldung nicht eingerichtet")).toHaveCount(0);
  await expect(page.getByLabel("E-Mail")).toBeVisible();
});
