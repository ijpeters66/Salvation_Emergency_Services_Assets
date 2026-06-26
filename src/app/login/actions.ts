"use server";

import { redirect } from "next/navigation";

import { getPublicEnvStatus } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  if (value.startsWith("/login")) {
    return "/dashboard";
  }

  return value;
}

function redirectToLogin(error: "configuration" | "credentials" | "inactive", nextPath: string) {
  const params = new URLSearchParams({ error, next: nextPath });
  redirect(`/login?${params.toString()}`);
}

export async function loginAction(formData: FormData) {
  const nextPath = getSafeNextPath(formData.get("next"));

  if (!getPublicEnvStatus().configured) {
    redirectToLogin("configuration", nextPath);
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectToLogin("credentials", nextPath);
  }

  const { data: profile } = await supabase
    .from("app_user_profile")
    .select("is_active")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();

  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    redirectToLogin("inactive", nextPath);
  }

  redirect(nextPath);
}

export async function logoutAction() {
  if (getPublicEnvStatus().configured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
