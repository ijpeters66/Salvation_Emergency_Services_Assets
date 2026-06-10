import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[var(--brand-red)] text-white">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--brand-red)]">SAES Asset Register</p>
            <h1 className="text-2xl font-semibold text-[var(--ink)]">Login</h1>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--ink)]">Authentication placeholder</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Supabase Auth will be implemented in a later prompt. This route is public and ready for
            the protected-route workflow.
          </p>
        </div>

        <Button asChild className="mt-6 w-full">
          <Link href="/dashboard">Continue to dashboard placeholder</Link>
        </Button>
      </section>
    </main>
  );
}
