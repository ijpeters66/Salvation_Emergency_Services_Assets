import { expect, test } from "@playwright/test";

test("offline indicator renders when the browser loses connectivity", async ({ page, context }) => {
  await page.goto("/login");
  await expect(page.getByTestId("offline-status-indicator")).toContainText("Online");

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByTestId("offline-status-indicator")).toContainText("Offline");
});
