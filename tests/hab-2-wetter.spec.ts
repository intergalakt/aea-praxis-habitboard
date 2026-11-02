import { expect, test } from "@playwright/test";

const OPEN_METEO = /(^|\.)open-meteo\.com$/;

test("AC-1: /wetter ist ohne Anmeldung erreichbar", async ({ page }) => {
  await page.goto("/wetter");

  await expect(page.getByRole("heading", { name: "Wetter", level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/\/wetter$/);
  await expect(page.getByRole("link", { name: "Anmelden" })).toBeVisible();
});

test("AC-2/AC-3: Ortssuche zeigt aktuelles Wetter und Tagesspanne", async ({ page }) => {
  await page.goto("/wetter");
  await page.getByLabel("Ort").fill("Freiburg");
  await page.getByRole("button", { name: "Wetter anzeigen" }).click();

  await expect(page).toHaveURL(/\/wetter\?ort=Freiburg/);
  // Ortsname kommt aus dem Geocoding, nicht aus der Eingabe.
  await expect(page.getByText(/Freiburg im Breisgau/)).toBeVisible();
  await expect(page.getByText(/°C/).first()).toBeVisible();
  await expect(page.getByText(/Stand: \d{2}\.\d{2}\.\d{4}, \d{2}:\d{2} Uhr/)).toBeVisible();
  await expect(page.getByText(/bis/)).toBeVisible();
});

test("AC-8: Attribution zu Open-Meteo ist sichtbar", async ({ page }) => {
  await page.goto("/wetter?ort=Wien");

  const link = page.getByRole("link", { name: "Open-Meteo" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "https://open-meteo.com/");
  await expect(page.getByText(/CC BY 4\.0/)).toBeVisible();
});

test("AC-9/EC-4: unbekannter Ort erhält eine deutsche Meldung statt 500", async ({ page }) => {
  const response = await page.goto("/wetter?ort=Xyzzyxq");

  expect(response?.status()).toBe(200);
  await expect(
    page.getByText("Für diesen Ort wurden keine Daten gefunden. Prüfe die Schreibweise."),
  ).toBeVisible();
});

test("AC-9: zu kurze Eingabe wird verständlich abgewiesen", async ({ page }) => {
  await page.goto("/wetter?ort=a");

  await expect(
    page.getByText("Bitte gib einen Ort mit mindestens zwei Zeichen ein."),
  ).toBeVisible();
});

test("AC-7: der Browser spricht nicht selbst mit Open-Meteo", async ({ page }) => {
  const direct: string[] = [];
  page.on("request", (request) => {
    const host = new URL(request.url()).hostname;
    if (OPEN_METEO.test(host)) direct.push(request.url());
  });

  await page.goto("/wetter?ort=Berlin");
  await expect(page.getByText(/Berlin/).first()).toBeVisible();

  expect(direct, `Direkte Upstream-Aufrufe aus dem Browser: ${direct.join(", ")}`).toEqual([]);
});

test("AC-2: Formular funktioniert ohne JavaScript (GET, serverseitig gerendert)", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/wetter?ort=Hamburg");
  await expect(page.getByText(/Hamburg/).first()).toBeVisible();
  await expect(page.getByText(/°C/).first()).toBeVisible();

  await context.close();
});
