import { NextResponse } from "next/server";

import { getAssetByQrCodeValue } from "@/lib/assets/server";
import { getConsumableBatchByQrCodeValue, getConsumableItemById } from "@/lib/consumables/server";
import { parseQrPayload } from "@/lib/qr";
import { getLocationById } from "@/lib/locations/server";
import { qrScanActions, resolveScanDestination, type QrScanAction } from "@/lib/scan";
import {
  previewAssets,
  previewConsumableBatches,
  previewConsumableItems,
  previewLocations,
  resolvePreviewScanDestination,
} from "@/lib/workflow-preview";

function isScanAction(value: string): value is QrScanAction {
  return qrScanActions.includes(value as QrScanAction);
}

function buildScanMessage(action: QrScanAction, label: string) {
  switch (action) {
    case "move_asset":
      return `${label} opened for the move workflow.`;
    case "issue_stock":
      return `${label} opened for the issue workflow.`;
    case "stocktake_placeholder":
      return `${label} opened for the stocktake workflow.`;
    default:
      return `${label} opened.`;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const payload = String(searchParams.get("payload") ?? "").trim();
  const actionValue = String(searchParams.get("action") ?? "view").trim();
  const isPreview = searchParams.get("preview") === "1";

  if (!payload) {
    return NextResponse.json({ error: "QR payload is required." }, { status: 400 });
  }

  if (!isScanAction(actionValue)) {
    return NextResponse.json({ error: "Unsupported scan action." }, { status: 400 });
  }

  if (isPreview) {
    const destination = resolvePreviewScanDestination(payload, actionValue);

    if (!destination) {
      return NextResponse.json({ error: "Preview scan could not be resolved." }, { status: 404 });
    }

    const previewAsset = previewAssets.find((item) => item.qr_code_value === payload);
    const previewBatch = previewConsumableBatches.find((item) => item.qr_code_value === payload);
    const previewLocation = previewLocations.find((item) => item.qr_code_value === payload);
    const label =
      previewAsset?.asset_name ??
      (previewBatch
        ? `${previewConsumableItems.find((item) => item.id === previewBatch.item_id)?.name ?? "Consumable batch"} ${previewBatch.batch_lot_number}`
        : null) ??
      previewLocation?.name ??
      "Record";

    return NextResponse.json({
      destination,
      scanMessage: buildScanMessage(actionValue, label),
    });
  }

  const parsed = parseQrPayload(payload);

  if (!parsed) {
    return NextResponse.json({ error: "QR payload is not recognised." }, { status: 404 });
  }

  if (parsed.recordType === "asset") {
    const asset = await getAssetByQrCodeValue(parsed.payload);
    if (!asset) {
      return NextResponse.json({ error: "Asset scan could not be resolved." }, { status: 404 });
    }

    const destination = resolveScanDestination(parsed, actionValue, {
      id: asset.id,
      recordType: "asset",
    });

    if (!destination) {
      return NextResponse.json({ error: "Asset scan could not be resolved." }, { status: 404 });
    }

    return NextResponse.json({
      destination,
      scanMessage: buildScanMessage(actionValue, asset.asset_name),
    });
  }

  if (parsed.recordType === "consumable_batch") {
    const batch = await getConsumableBatchByQrCodeValue(parsed.payload);

    if (!batch) {
      return NextResponse.json(
        { error: "Consumable batch scan could not be resolved." },
        { status: 404 },
      );
    }

    const item = await getConsumableItemById(batch.item_id);
    const destination = resolveScanDestination(parsed, actionValue, {
      id: batch.id,
      recordType: "consumable_batch",
    });

    if (!destination) {
      return NextResponse.json(
        { error: "Consumable batch scan could not be resolved." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      destination,
      scanMessage: buildScanMessage(
        actionValue,
        `${item?.name ?? "Consumable batch"} ${batch.batch_lot_number}`,
      ),
    });
  }

  const location = await getLocationById(parsed.recordKey);

  if (!location) {
    return NextResponse.json({ error: "Location scan could not be resolved." }, { status: 404 });
  }

  const destination = resolveScanDestination(parsed, actionValue, {
    id: location.id,
    recordType: "location",
  });

  if (!destination) {
    return NextResponse.json({ error: "Location scan could not be resolved." }, { status: 404 });
  }

  return NextResponse.json({
    destination,
    scanMessage: buildScanMessage(actionValue, location.name),
  });
}
