import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
}

test("regular visitors are redirected away from settings", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("admin can create a movement reason", async ({ page }) => {
  test.skip(!adminEmail || !adminPassword, "Admin Playwright credentials not configured.");

  const reasonLabel = `QA Reason ${Date.now()}`;

  await login(page, adminEmail!, adminPassword!);
  await page.goto("/settings");
  await page.getByRole("heading", { name: "Settings" }).waitFor();

  await page.getByLabel("Reason label").fill(reasonLabel);
  await page.getByLabel("Description").last().fill("Created by Playwright admin coverage.");
  await page.getByLabel("Sort order").fill("950");
  await page.getByRole("button", { name: "Add movement reason" }).click();

  await expect(page).toHaveURL(/statusMessage=movement-reason-saved/);
  await expect(page.getByText(reasonLabel)).toBeVisible();
});
