import { expect, test } from "@playwright/test";

test("prompt 29 preview workflow stays connected across core modules", async ({ page }) => {
  await page.goto("/locations?preview=1");
  await expect(page.getByText("Hamilton staging")).toBeVisible();

  await page.goto("/assets?preview=1");
  await expect(page.getByText("Support trailer")).toBeVisible();
  await page.getByRole("link", { name: "Support trailer" }).click();
  await expect(page.getByText("Child assets")).toBeVisible();
  await expect(page.getByText("Generator")).toBeVisible();
  await expect(page.getByText("Asset attachments")).toBeVisible();

  await page.goto("/consumables?preview=1");
  await expect(page.getByText("Trauma dressing")).toBeVisible();
  await page.getByRole("link", { name: /Trauma dressing/ }).first().click();
  await expect(page.getByText("Threshold management")).toBeVisible();

  await page.goto("/deployments?preview=1");
  await page.getByRole("link", { name: "Hamilton flood support" }).click();
  await expect(page.getByText("Deployment assets")).toBeVisible();
  await expect(page.getByText("Issue consumables")).toBeVisible();

  await page.goto("/maintenance?preview=1");
  await expect(page.getByText("Approved vendors")).toBeVisible();

  await page.goto("/scan?preview=1");
  await page.getByLabel("QR payload").fill("SAES-ASSET:TRAILER-001");
  await page.getByRole("button", { name: "Resolve code" }).click();
  await expect(page).toHaveURL(/\/assets\/preview-1\?preview=1/);

  await page.goto("/audit?preview=1");
  await expect(page.getByText("Audit events")).toBeVisible();

  await page.goto("/reports?preview=1&reportId=asset-register");
  await expect(page.getByRole("link", { name: "CSV" }).first()).toBeVisible();
});
