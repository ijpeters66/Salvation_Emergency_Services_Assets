import QRCode from "qrcode";

import { QrPrintButton } from "@/components/qr-print-button";

type QrCodeCardProps = {
  title: string;
  payload: string;
  subtitle?: string;
  label?: string;
};

function QrSvg({ payload }: { payload: string }) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "Q" });
  const moduleSize = 4;
  const quietZone = 4;
  const dimension = (qr.modules.size + quietZone * 2) * moduleSize;

  return (
    <svg
      aria-label={`QR payload ${payload}`}
      className="h-auto w-full max-w-[12rem]"
      role="img"
      viewBox={`0 0 ${dimension} ${dimension}`}
    >
      <rect fill="#ffffff" height={dimension} width={dimension} x="0" y="0" />
      {Array.from({ length: qr.modules.size }).flatMap((_, y) =>
        Array.from({ length: qr.modules.size }).map((__, x) =>
          qr.modules.get(y, x) ? (
            <rect
              fill="#111111"
              height={moduleSize}
              key={`${x}-${y}`}
              width={moduleSize}
              x={(x + quietZone) * moduleSize}
              y={(y + quietZone) * moduleSize}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

export function QrCodeCard({ title, payload, subtitle, label = "QR label" }: QrCodeCardProps) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
            <QrPrintButton meta={label} name={title} payload={payload} />
          </div>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
          ) : null}
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            {label}
          </p>
          <p className="mt-2 break-all font-mono text-sm text-[var(--ink)]">{payload}</p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
          <QrSvg payload={payload} />
        </div>
      </div>
    </section>
  );
}

export function PrintableQrLabel({
  name,
  payload,
  meta,
}: {
  name: string;
  payload: string;
  meta: string;
}) {
  return (
    <article className="rounded-md border border-dashed border-[var(--border)] bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-red)]">
              Printable label
            </p>
            <QrPrintButton meta={meta} name={name} payload={payload} />
          </div>
          <h3 className="mt-3 text-base font-semibold text-[var(--ink)]">{name}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{meta}</p>
          <p className="mt-3 break-all font-mono text-xs text-[var(--ink)]">{payload}</p>
        </div>
        <div className="shrink-0 rounded-md border border-[var(--border)] bg-white p-2">
          <QrSvg payload={payload} />
        </div>
      </div>
    </article>
  );
}
