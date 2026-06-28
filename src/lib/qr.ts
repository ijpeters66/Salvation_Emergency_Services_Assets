export const qrRecordTypes = ["asset", "consumable_batch", "location"] as const;

export type QrRecordType = (typeof qrRecordTypes)[number];

export type ParsedQrPayload =
  | {
      recordType: "asset";
      recordKey: string;
      payload: string;
    }
  | {
      recordType: "consumable_batch";
      recordKey: string;
      payload: string;
      itemKey: string;
    }
  | {
      recordType: "location";
      recordKey: string;
      payload: string;
    };

function normaliseSegment(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

export function buildLocationQrCodeValue(locationId: string) {
  return `SAES-LOCATION:${normaliseSegment(locationId)}`;
}

export function parseQrPayload(value: string): ParsedQrPayload | null {
  const payload = value.trim();

  if (!payload) {
    return null;
  }

  if (payload.startsWith("SAES-ASSET:")) {
    const recordKey = payload.slice("SAES-ASSET:".length).trim();

    if (!recordKey) {
      return null;
    }

    return { recordType: "asset", recordKey, payload };
  }

  if (payload.startsWith("SAES-CONSUMABLE:")) {
    const [, itemKey = "", ...rest] = payload.split(":");
    const recordKey = rest.join(":").trim();

    if (!itemKey || !recordKey) {
      return null;
    }

    return { recordType: "consumable_batch", itemKey, recordKey, payload };
  }

  if (payload.startsWith("SAES-LOCATION:")) {
    const recordKey = payload.slice("SAES-LOCATION:".length).trim();

    if (!recordKey) {
      return null;
    }

    return { recordType: "location", recordKey, payload };
  }

  return null;
}
