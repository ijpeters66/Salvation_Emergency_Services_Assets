import { expect, test } from "@playwright/test";

test("attachment sections render on preview asset detail", async ({ page }) => {
  await page.goto("/assets/preview-1?preview=1");

  await expect(page.getByText("Asset attachments")).toBeVisible();
  await expect(page.getByText("Plant and fleet attachments")).toBeVisible();
  await expect(page.getByLabel("Upload file").first()).toBeVisible();
});
