import { expect, test } from "@playwright/test";

test("consumable preview flow shows batch detail and FIFO issue context", async ({ page }) => {
  await page.goto("/consumables?preview=1");

  await expect(page.getByRole("heading", { name: "Consumables", exact: true })).toBeVisible();
  await expect(page.getByText("Trauma dressing")).toBeVisible();
  await page.getByRole("link", { name: "View" }).first().click();

  await expect(page).toHaveURL(/\/consumables\/preview-batch-1\?preview=1/);
  await expect(page.getByRole("heading", { name: "Trauma dressing" })).toBeVisible();
  await expect(page.getByText("Record stock movement")).toBeVisible();
  await expect(page.getByText("Stock movement ledger")).toBeVisible();
});

test("consumable item threshold preview page is reachable", async ({ page }) => {
  await page.goto("/consumables/items/preview-item-1?preview=1");

  await expect(page.getByRole("heading", { name: "Trauma dressing" })).toBeVisible();
  await expect(page.getByText("Threshold management")).toBeVisible();
  await expect(page.getByText("Stock by location")).toBeVisible();
});
