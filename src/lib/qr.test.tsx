import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QrCodeCard } from "@/components/qr-code-card";
import { buildQrCodeValue } from "@/lib/assets/validation";
import { buildConsumableQrCodeValue } from "@/lib/consumables/validation";
import { buildLocationQrCodeValue, parseQrPayload } from "@/lib/qr";

describe("QR payloads", () => {
  it("builds stable QR payloads for assets, consumables, and locations", () => {
    expect(buildQrCodeValue("gen 001")).toBe("SAES-ASSET:GEN-001");
    expect(buildConsumableQrCodeValue("Nitrile gloves", "lot 1")).toBe(
      "SAES-CONSUMABLE:NITRILE-GLOVES:LOT-1",
    );
    expect(buildLocationQrCodeValue("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "SAES-LOCATION:550E8400-E29B-41D4-A716-446655440000",
    );
  });

  it("parses supported QR payloads", () => {
    expect(parseQrPayload("SAES-ASSET:GEN-001")).toEqual({
      payload: "SAES-ASSET:GEN-001",
      recordKey: "GEN-001",
      recordType: "asset",
    });

    expect(parseQrPayload("SAES-CONSUMABLE:NITRILE-GLOVES:LOT-1")).toEqual({
      itemKey: "NITRILE-GLOVES",
      payload: "SAES-CONSUMABLE:NITRILE-GLOVES:LOT-1",
      recordKey: "LOT-1",
      recordType: "consumable_batch",
    });

    expect(parseQrPayload("SAES-LOCATION:550E8400-E29B-41D4-A716-446655440000")).toEqual({
      payload: "SAES-LOCATION:550E8400-E29B-41D4-A716-446655440000",
      recordKey: "550E8400-E29B-41D4-A716-446655440000",
      recordType: "location",
    });
  });

  it("returns null for unsupported payloads", () => {
    expect(parseQrPayload("hello world")).toBeNull();
    expect(parseQrPayload("SAES-CONSUMABLE:ONLY-ITEM")).toBeNull();
    expect(parseQrPayload("")).toBeNull();
  });
});

describe("QrCodeCard", () => {
  it("renders the expected QR payload and svg shell", () => {
    const markup = renderToStaticMarkup(
      <QrCodeCard payload="SAES-ASSET:GEN-001" title="Asset QR label" />,
    );

    expect(markup).toContain("Asset QR label");
    expect(markup).toContain("SAES-ASSET:GEN-001");
    expect(markup).toContain("<svg");
    expect(markup).toContain("QR payload SAES-ASSET:GEN-001");
  });
});
