"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <RouteErrorState
          description="The application hit an unexpected error. Try again, then check server logs and recent offline mutations if the problem persists."
          reset={reset}
          retryLabel="Retry application"
          title="Application unavailable"
        />
      </body>
    </html>
  );
}
