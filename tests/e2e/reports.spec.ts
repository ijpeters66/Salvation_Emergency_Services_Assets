import { expect, test } from "@playwright/test";

test("reports page exports CSV, XLSX, and PDF in preview mode", async ({ page }) => {
  await page.goto("/reports?preview=1&reportId=asset-register");

  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  await expect(page.getByText("Preview mode")).toBeVisible();
  await expect(page.getByRole("link", { name: "CSV" }).first()).toHaveAttribute(
    "href",
    /format=csv/,
  );
  await expect(page.getByRole("link", { name: "XLSX" }).first()).toHaveAttribute(
    "href",
    /format=xlsx/,
  );
  await expect(page.getByRole("link", { name: "PDF" }).first()).toHaveAttribute(
    "href",
    /format=pdf/,
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "CSV" }).first().click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("asset-register");

  const xlsxDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "XLSX" }).first().click();
  const xlsxDownload = await xlsxDownloadPromise;
  expect(xlsxDownload.suggestedFilename()).toContain(".xlsx");

  const pdfDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "PDF" }).first().click();
  const pdfDownload = await pdfDownloadPromise;
  expect(pdfDownload.suggestedFilename()).toContain(".pdf");
});
