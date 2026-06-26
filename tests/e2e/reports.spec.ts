import { expect, test } from "@playwright/test";

test("reports page exports a CSV in preview mode", async ({ page }) => {
  await page.goto("/reports?preview=1&reportId=asset-register");

  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  await expect(page.getByText("Preview mode")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export CSV" }).first().click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("asset-register");
});
