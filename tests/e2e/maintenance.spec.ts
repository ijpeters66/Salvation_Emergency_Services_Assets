import { expect, test } from "@playwright/test";

test("maintenance preview route shows due maintenance and approved vendors", async ({ page }) => {
  await page.goto("/maintenance?preview=1");

  await expect(page.getByRole("heading", { name: "Maintenance", exact: true })).toBeVisible();
  await expect(page.getByText("Due maintenance")).toBeVisible();
  await expect(page.getByText("Approved vendors")).toBeVisible();
  await expect(page.getByText("Western District Fleet")).toBeVisible();
});
