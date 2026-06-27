import { expect, test } from "@playwright/test";

test("asset preview flow shows detail, child asset assignment, and QR label", async ({ page }) => {
  await page.goto("/assets?preview=1");

  await expect(page.getByRole("heading", { name: "Assets", exact: true })).toBeVisible();
  await expect(page.getByText("Preview mode")).toBeVisible();
  await page.getByRole("link", { name: "Support trailer" }).click();

  await expect(page).toHaveURL(/\/assets\/preview-1\?preview=1/);
  await expect(page.getByRole("heading", { name: "Support trailer" })).toBeVisible();
  await expect(page.getByText("Child assets")).toBeVisible();
  await expect(page.getByText("Generator")).toBeVisible();
  await expect(page.getByText("Asset QR label")).toBeVisible();
});

test("plant and fleet preview details are reachable from the asset detail view", async ({ page }) => {
  await page.goto("/assets/preview-2?preview=1");

  await expect(page.getByRole("heading", { name: "Generator" })).toBeVisible();
  await expect(page.getByText("Plant and fleet details")).toBeVisible();
  await expect(page.getByText("Western District Fleet")).toBeVisible();
});
