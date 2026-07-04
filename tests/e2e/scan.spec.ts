import { expect, test } from "@playwright/test";

test("preview scan manual entry routes to the preview asset detail page", async ({ page }) => {
  await page.goto("/scan?preview=1");

  await page.getByLabel("QR payload").fill("SAES-ASSET:TRAILER-001");
  await page.getByRole("button", { name: "Resolve code" }).click();

  await expect(page).toHaveURL(/\/assets\/preview-1\?preview=1/);
  await expect(page.getByRole("heading", { name: "Support trailer" })).toBeVisible();
  await expect(page.getByText("Support trailer opened.")).toBeVisible();
});
