import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { loginAction } from "@/app/login/actions";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorMessage(error: string | undefined) {
  if (error === "configuration") {
    return "Supabase is not configured yet. Add the public URL and anon key before signing in.";
  }

  if (error === "credentials") {
    return "Those login details did not work. Check the email and password, then try again.";
  }

  if (error === "inactive") {
    return "This user profile has been deactivated. Contact a system admin for access.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = getParam(params.next) ?? "/dashboard";
  const errorMessage = getErrorMessage(getParam(params.error));

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

        {errorMessage ? (
          <p className="mt-6 rounded-md border border-[var(--brand-red)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--brand-red)]">
            {errorMessage}
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 grid gap-4">
          <input name="next" type="hidden" value={nextPath} />
          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            Email
            <input
              autoComplete="email"
              className="h-11 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            Password
            <input
              autoComplete="current-password"
              className="h-11 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
              name="password"
              required
              type="password"
            />
          </label>

          <Button className="mt-2 w-full" type="submit">
            Login
          </Button>
        </form>
      </section>
    </main>
  );
}
