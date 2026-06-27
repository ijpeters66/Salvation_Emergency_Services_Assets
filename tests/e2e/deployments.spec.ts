import { expect, test } from "@playwright/test";

test("deployment preview route shows active deployment detail and issued stock context", async ({ page }) => {
  await page.goto("/deployments?preview=1");

  await expect(page.getByRole("heading", { name: "Deployment records" })).toBeVisible();
  await page.getByRole("link", { name: "Hamilton flood support" }).click();

  await expect(page).toHaveURL(/\/deployments\/preview-deployment-1\?preview=1/);
  await expect(page.getByText("Deployment assets")).toBeVisible();
  await expect(page.getByText("Issue consumables")).toBeVisible();
  await expect(page.getByText("Issued consumables")).toBeVisible();
});
