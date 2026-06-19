import { getScanSupportMessage } from "@/lib/scan";

export function ScanSupportNotice({
  hasBarcodeDetector,
  hasCamera,
}: {
  hasCamera: boolean;
  hasBarcodeDetector: boolean;
}) {
  return (
    <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm leading-6 text-[var(--muted)]">
      {getScanSupportMessage({ hasCamera, hasBarcodeDetector })}
    </p>
  );
}
