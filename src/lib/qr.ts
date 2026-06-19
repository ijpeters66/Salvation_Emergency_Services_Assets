import { createHash } from "node:crypto";

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

function hashBits(value: string) {
  const digest = createHash("sha256").update(value).digest();
  const bits: number[] = [];

  for (const byte of digest) {
    for (let index = 7; index >= 0; index -= 1) {
      bits.push((byte >> index) & 1);
    }
  }

  return bits;
}

function drawFinder(matrix: boolean[][], startX: number, startY: number) {
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const outer = x === 0 || x === 6 || y === 0 || y === 6;
      const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      matrix[startY + y][startX + x] = outer || inner;
    }
  }
}

export function buildPseudoQrMatrix(payload: string, size = 29) {
  const matrix = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const reserved = Array.from({ length: size }, () => Array.from({ length: size }, () => false));

  const reserveSquare = (startX: number, startY: number, length: number) => {
    for (let y = 0; y < length; y += 1) {
      for (let x = 0; x < length; x += 1) {
        reserved[startY + y][startX + x] = true;
      }
    }
  };

  drawFinder(matrix, 0, 0);
  drawFinder(matrix, size - 7, 0);
  drawFinder(matrix, 0, size - 7);
  reserveSquare(0, 0, 8);
  reserveSquare(size - 8, 0, 8);
  reserveSquare(0, size - 8, 8);

  for (let index = 8; index < size - 8; index += 1) {
    const dark = index % 2 === 0;
    matrix[6][index] = dark;
    matrix[index][6] = dark;
    reserved[6][index] = true;
    reserved[index][6] = true;
  }

  matrix[size - 8][8] = true;
  reserved[size - 8][8] = true;

  const bits = hashBits(payload);
  let bitIndex = 0;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (reserved[y][x]) {
        continue;
      }

      const bit = bits[bitIndex % bits.length];
      const mask = (x * 3 + y * 5) % 2 === 0 ? 1 : 0;
      matrix[y][x] = Boolean(bit ^ mask);
      bitIndex += 1;
    }
  }

  return matrix;
}
