import { expect, test } from "@playwright/test";

test("low-stock dashboard tile opens filtered consumables page", async ({ page }) => {
  await page.goto("/dashboard?preview=1");

  await page.getByRole("link", { name: /Low Stock Items/i }).click();

  await expect(page).toHaveURL(/\/consumables\?alert=low-stock&preview=1/);
  await expect(page.getByRole("heading", { name: "Consumables", exact: true })).toBeVisible();
  await expect(page.locator('select[name="alert"]')).toHaveValue("low-stock");
});
