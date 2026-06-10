import { expect, test } from "@playwright/test";

test("health route renders safe configuration status", async ({ page }) => {
  await page.goto("/health");

  await expect(page.getByRole("heading", { name: "Application status" })).toBeVisible();
  await expect(page.getByText(/Supabase configuration is/)).toBeVisible();
  await expect(page.getByText("NEXT_PUBLIC_SUPABASE_ANON_KEY")).toBeVisible();
});
