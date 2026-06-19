"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, LoaderCircle, QrCode, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";

import { ScanSupportNotice } from "@/components/scan-support-notice";
import { Button } from "@/components/ui/button";
import { qrScanActions, type QrScanAction } from "@/lib/scan";

type BarcodeDetectorResult = {
  rawValue?: string;
};

type BarcodeDetectorInstance = {
  detect(source: ImageBitmapSource): Promise<BarcodeDetectorResult[]>;
};

type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

const actionLabels: Record<QrScanAction, string> = {
  view: "View record",
  move_asset: "Move asset",
  issue_stock: "Issue consumables",
  stocktake_placeholder: "Stocktake placeholder",
};

export function ScanClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<number>(0);
  const scanLoopRef = useRef<() => void>(() => {});

  const [selectedAction, setSelectedAction] = useState<QrScanAction>("view");
  const [manualValue, setManualValue] = useState("");
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const support = useMemo(
    () => ({
      hasCamera: typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia),
      hasBarcodeDetector:
        typeof window !== "undefined" && typeof window.BarcodeDetector === "function",
    }),
    [],
  );

  const stopCamera = useCallback(() => {
    if (frameRef.current != null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const queueNextFrame = useCallback(() => {
    frameRef.current = window.requestAnimationFrame(() => {
      scanLoopRef.current();
    });
  }, []);

  const resolvePayload = useCallback(
    async (payload: string) => {
      setIsResolving(true);
      setMessage(null);

      try {
        const response = await fetch(
          `/api/scan/resolve?payload=${encodeURIComponent(payload)}&action=${encodeURIComponent(selectedAction)}`,
        );
        const data = (await response.json()) as { destination?: string; error?: string };

        if (!response.ok || !data.destination) {
          setMessage(data.error ?? "The scanned code could not be resolved.");
          return;
        }

        stopCamera();
        router.push(data.destination);
      } catch {
        setMessage("The scan could not be resolved. Check your connection and try again.");
      } finally {
        setIsResolving(false);
      }
    },
    [router, selectedAction, stopCamera],
  );

  const scanCurrentFrame = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current || isResolving) {
      queueNextFrame();
      return;
    }

    const now = Date.now();
    if (now - lastDetectionRef.current < 400) {
      queueNextFrame();
      return;
    }

    lastDetectionRef.current = now;

    try {
      const results = await detectorRef.current.detect(videoRef.current);
      const payload = results.find((result) => result.rawValue)?.rawValue?.trim();

      if (payload) {
        await resolvePayload(payload);
        return;
      }
    } catch {
      setMessage("The camera opened, but barcode detection failed on this device.");
      stopCamera();
      return;
    }

    queueNextFrame();
  }, [isResolving, queueNextFrame, resolvePayload, stopCamera]);

  useEffect(() => {
    scanLoopRef.current = () => {
      void scanCurrentFrame();
    };
  }, [scanCurrentFrame]);

  const startCamera = useCallback(async () => {
    if (!support.hasCamera || !support.hasBarcodeDetector) {
      setMessage("Camera scanning is not available here. Use manual QR entry instead.");
      return;
    }

    setIsStartingCamera(true);
    setMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      const BarcodeDetectorCtor = window.BarcodeDetector;

      if (!BarcodeDetectorCtor) {
        throw new Error("Barcode detector unavailable");
      }

      detectorRef.current = new BarcodeDetectorCtor({ formats: ["qr_code"] });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      queueNextFrame();
    } catch {
      stopCamera();
      setMessage("Unable to start the camera scanner on this device. Use manual QR entry.");
    } finally {
      setIsStartingCamera(false);
    }
  }, [queueNextFrame, stopCamera, support.hasBarcodeDetector, support.hasCamera]);

  return (
    <div className="grid gap-6">
      <section className="rounded-md border border-[var(--border)] bg-white p-5">
        <div className="flex items-center gap-2">
          <QrCode className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-[var(--ink)]">Scan action</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
            Action
            <select
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
              onChange={(event) => setSelectedAction(event.target.value as QrScanAction)}
              value={selectedAction}
            >
              {qrScanActions.map((action) => (
                <option key={action} value={action}>
                  {actionLabels[action]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Camera className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Camera scanner</h2>
          </div>
          <div className="mt-4 grid gap-4">
            <ScanSupportNotice
              hasBarcodeDetector={support.hasBarcodeDetector}
              hasCamera={support.hasCamera}
            />
            <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]">
              <video
                className="aspect-[4/3] w-full bg-[var(--surface)] object-cover"
                muted
                playsInline
                ref={videoRef}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button disabled={isStartingCamera || isResolving} onClick={startCamera} type="button">
                {isStartingCamera ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ScanLine className="size-4" aria-hidden="true" />
                )}
                {isCameraActive ? "Restart scan" : "Start camera scan"}
              </Button>
              <Button onClick={stopCamera} type="button" variant="outline">
                Stop camera
              </Button>
            </div>
          </div>
        </article>

        <article className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Manual fallback</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Paste or type the QR payload when camera access is not available. This also works as a
            stocktake fallback on desktop.
          </p>
          <form
            className="mt-4 grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              await resolvePayload(manualValue);
            }}
          >
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              QR payload
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal outline-none focus:border-[var(--brand-red)]"
                onChange={(event) => setManualValue(event.target.value)}
                placeholder="SAES-ASSET:GEN-001"
                value={manualValue}
              />
            </label>
            <div>
              <Button disabled={!manualValue.trim() || isResolving} type="submit">
                {isResolving ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <QrCode className="size-4" aria-hidden="true" />
                )}
                Resolve code
              </Button>
            </div>
          </form>
          {message ? (
            <p className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm leading-6 text-[var(--ink)]">
              {message}
            </p>
          ) : null}
        </article>
      </section>
    </div>
  );
}
