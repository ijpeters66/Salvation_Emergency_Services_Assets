import type { ParsedQrPayload } from "@/lib/qr";

export const qrScanActions = [
  "view",
  "move_asset",
  "issue_stock",
  "stocktake_placeholder",
] as const;

export type QrScanAction = (typeof qrScanActions)[number];

export type ResolvedScanRecord =
  | { id: string; recordType: "asset" }
  | { id: string; recordType: "consumable_batch" }
  | { id: string; recordType: "location" };

export function resolveScanDestination(
  parsed: ParsedQrPayload,
  action: QrScanAction,
  record: ResolvedScanRecord,
) {
  if (parsed.recordType !== record.recordType) {
    return null;
  }

  switch (record.recordType) {
    case "asset":
      if (action === "issue_stock") {
        return null;
      }

      if (action === "move_asset") {
        return `/assets/${record.id}?scanAction=move`;
      }

      if (action === "stocktake_placeholder") {
        return `/assets/${record.id}?scanAction=stocktake`;
      }

      return `/assets/${record.id}`;

    case "consumable_batch":
      if (action === "move_asset") {
        return null;
      }

      if (action === "issue_stock") {
        return `/consumables/${record.id}?scanAction=issue`;
      }

      if (action === "stocktake_placeholder") {
        return `/consumables/${record.id}?scanAction=stocktake`;
      }

      return `/consumables/${record.id}`;

    case "location":
      if (action === "move_asset") {
        return `/locations/${record.id}?scanAction=move`;
      }

      if (action === "issue_stock") {
        return null;
      }

      if (action === "stocktake_placeholder") {
        return `/locations/${record.id}?scanAction=stocktake`;
      }

      return `/locations/${record.id}`;
  }
}

export function getScanSupportMessage({
  hasCamera,
  hasBarcodeDetector,
}: {
  hasCamera: boolean;
  hasBarcodeDetector: boolean;
}) {
  if (hasCamera && hasBarcodeDetector) {
    return "Camera scanning is available on this device.";
  }

  if (!hasCamera) {
    return "Camera access is not available here. Use manual QR entry instead.";
  }

  return "This browser can access the camera, but barcode detection is not available. Use manual QR entry instead.";
}
