import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { isPublicRoute } from "@/lib/auth-state";

const previewPaths = new Set([
  "/dashboard",
  "/assets",
  "/consumables",
  "/deployments",
  "/locations",
  "/maintenance",
  "/reports",
  "/scan",
  "/audit",
]);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPreviewMode =
    request.nextUrl.searchParams.get("preview") === "1" &&
    (previewPaths.has(pathname) ||
      pathname.startsWith("/assets/") ||
      pathname.startsWith("/consumables/") ||
      pathname.startsWith("/deployments/"));

  if (isPublicRoute(pathname) || isPreviewMode) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = new URLSearchParams({
      error: "configuration",
      next: pathname,
    }).toString();

    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = new URLSearchParams({ next: pathname }).toString();

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
