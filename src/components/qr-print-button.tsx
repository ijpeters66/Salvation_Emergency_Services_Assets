"use client";

import { Printer } from "lucide-react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildQrSvgMarkup(payload: string) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "Q" });
  const moduleSize = 6;
  const quietZone = 4;
  const dimension = (qr.modules.size + quietZone * 2) * moduleSize;
  const cells: string[] = [];

  for (let y = 0; y < qr.modules.size; y += 1) {
    for (let x = 0; x < qr.modules.size; x += 1) {
      if (!qr.modules.get(y, x)) continue;

      cells.push(
        `<rect fill="#111111" height="${moduleSize}" width="${moduleSize}" x="${(x + quietZone) * moduleSize}" y="${(y + quietZone) * moduleSize}" />`,
      );
    }
  }

  return `<svg aria-label="QR payload ${escapeHtml(payload)}" role="img" viewBox="0 0 ${dimension} ${dimension}" xmlns="http://www.w3.org/2000/svg"><rect fill="#ffffff" height="${dimension}" width="${dimension}" x="0" y="0" />${cells.join("")}</svg>`;
}

export function QrPrintButton({
  name,
  payload,
  meta,
}: {
  name: string;
  payload: string;
  meta: string;
}) {
  const printLabel = () => {
    const printWindow = window.open("", "_blank", "width=480,height=640");

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>${escapeHtml(name)} QR label</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        color: #111111;
        font-family: Arial, Helvetica, sans-serif;
      }
      .label {
        width: 92mm;
        min-height: 54mm;
        border: 1px solid #222222;
        display: grid;
        grid-template-columns: 1fr 34mm;
        gap: 12px;
        align-items: center;
        padding: 10mm;
      }
      .eyebrow {
        color: #b51623;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        margin: 0 0 8px;
        text-transform: uppercase;
      }
      h1 {
        font-size: 16px;
        line-height: 1.2;
        margin: 0 0 6px;
      }
      .meta {
        color: #444444;
        font-size: 11px;
        line-height: 1.35;
        margin: 0 0 10px;
      }
      .payload {
        font-family: "Courier New", monospace;
        font-size: 8px;
        line-height: 1.25;
        margin: 0;
        overflow-wrap: anywhere;
      }
      svg {
        display: block;
        width: 34mm;
        height: 34mm;
      }
      @page {
        margin: 8mm;
      }
      @media print {
        body { padding: 0; }
      }
    </style>
  </head>
  <body>
    <article class="label">
      <div>
        <p class="eyebrow">QR label</p>
        <h1>${escapeHtml(name)}</h1>
        <p class="meta">${escapeHtml(meta)}</p>
        <p class="payload">${escapeHtml(payload)}</p>
      </div>
      ${buildQrSvgMarkup(payload)}
    </article>
    <script>
      window.addEventListener("load", () => {
        window.focus();
        window.print();
      });
    </script>
  </body>
</html>`);
    printWindow.document.close();
  };

  return (
    <Button className="shadow-sm" onClick={printLabel} type="button">
      <Printer className="size-4" aria-hidden="true" />
      Print QR label
    </Button>
  );
}
