import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ScanSupportNotice } from "@/components/scan-support-notice";
import { parseQrPayload } from "@/lib/qr";
import { getScanSupportMessage, resolveScanDestination } from "@/lib/scan";

describe("scan routing", () => {
  it("routes asset scans to the move workflow when requested", () => {
    const parsed = parseQrPayload("SAES-ASSET:GEN-001");

    expect(parsed).not.toBeNull();
    expect(
      resolveScanDestination(parsed!, "move_asset", {
        id: "asset-123",
        recordType: "asset",
      }),
    ).toBe("/assets/asset-123?scanAction=move");
  });

  it("routes consumable scans to the issue workflow when requested", () => {
    const parsed = parseQrPayload("SAES-CONSUMABLE:GLOVES:LOT-1");

    expect(parsed).not.toBeNull();
    expect(
      resolveScanDestination(parsed!, "issue_stock", {
        id: "batch-123",
        recordType: "consumable_batch",
      }),
    ).toBe("/consumables/batch-123?scanAction=issue");
  });

  it("rejects invalid scan action and record combinations", () => {
    const parsed = parseQrPayload("SAES-LOCATION:550E8400-E29B-41D4-A716-446655440000");

    expect(parsed).not.toBeNull();
    expect(
      resolveScanDestination(parsed!, "issue_stock", {
        id: "550e8400-e29b-41d4-a716-446655440000",
        recordType: "location",
      }),
    ).toBeNull();
  });
});

describe("ScanSupportNotice", () => {
  it("renders the fallback message when camera scanning is unavailable", () => {
    expect(getScanSupportMessage({ hasBarcodeDetector: false, hasCamera: false })).toBe(
      "Camera access is not available here. Use manual QR entry instead.",
    );

    const markup = renderToStaticMarkup(
      <ScanSupportNotice hasBarcodeDetector={false} hasCamera={false} />,
    );

    expect(markup).toContain("manual QR entry");
  });

  it("uses compatibility mode when camera access exists without native barcode detection", () => {
    expect(getScanSupportMessage({ hasBarcodeDetector: false, hasCamera: true })).toBe(
      "Camera scanning is available using compatibility mode.",
    );
  });
});
