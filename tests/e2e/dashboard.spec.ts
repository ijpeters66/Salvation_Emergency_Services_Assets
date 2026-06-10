import { expect, test } from "@playwright/test";

test("dashboard route renders the app shell", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("SAES Asset Register")).toBeVisible();
  await expect(page.getByRole("link", { name: /Locations/ })).toBeVisible();
  await expect(page.getByText("Foundation checks")).toBeVisible();
});
