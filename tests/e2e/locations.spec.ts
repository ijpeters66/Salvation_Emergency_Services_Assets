import { expect, test } from "@playwright/test";

test("location preview route shows the operational locations register", async ({ page }) => {
  await page.goto("/locations?preview=1");

  await expect(page.getByRole("heading", { name: "Locations", exact: true })).toBeVisible();
  await expect(page.getByText("Preview mode")).toBeVisible();
  await expect(page.getByText("Ballarat depot")).toBeVisible();
  await expect(page.getByText("Hamilton staging")).toBeVisible();
});
