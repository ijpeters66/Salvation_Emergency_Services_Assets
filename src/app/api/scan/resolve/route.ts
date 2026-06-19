import { NextResponse } from "next/server";

import { getAssetByQrCodeValue } from "@/lib/assets/server";
import { getConsumableBatchByQrCodeValue } from "@/lib/consumables/server";
import { parseQrPayload } from "@/lib/qr";
import { getLocationById } from "@/lib/locations/server";
import { qrScanActions, resolveScanDestination, type QrScanAction } from "@/lib/scan";

function isScanAction(value: string): value is QrScanAction {
  return qrScanActions.includes(value as QrScanAction);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const payload = String(searchParams.get("payload") ?? "").trim();
  const actionValue = String(searchParams.get("action") ?? "view").trim();

  if (!payload) {
    return NextResponse.json({ error: "QR payload is required." }, { status: 400 });
  }

  if (!isScanAction(actionValue)) {
    return NextResponse.json({ error: "Unsupported scan action." }, { status: 400 });
  }

  const parsed = parseQrPayload(payload);

  if (!parsed) {
    return NextResponse.json({ error: "QR payload is not recognised." }, { status: 404 });
  }

  if (parsed.recordType === "asset") {
    const asset = await getAssetByQrCodeValue(parsed.payload);
    const destination = asset
      ? resolveScanDestination(parsed, actionValue, { id: asset.id, recordType: "asset" })
      : null;

    if (!destination) {
      return NextResponse.json({ error: "Asset scan could not be resolved." }, { status: 404 });
    }

    return NextResponse.json({ destination });
  }

  if (parsed.recordType === "consumable_batch") {
    const batch = await getConsumableBatchByQrCodeValue(parsed.payload);
    const destination = batch
      ? resolveScanDestination(parsed, actionValue, {
          id: batch.id,
          recordType: "consumable_batch",
        })
      : null;

    if (!destination) {
      return NextResponse.json(
        { error: "Consumable batch scan could not be resolved." },
        { status: 404 },
      );
    }

    return NextResponse.json({ destination });
  }

  const location = await getLocationById(parsed.recordKey);
  const destination = location
    ? resolveScanDestination(parsed, actionValue, { id: location.id, recordType: "location" })
    : null;

  if (!destination) {
    return NextResponse.json({ error: "Location scan could not be resolved." }, { status: 404 });
  }

  return NextResponse.json({ destination });
}
