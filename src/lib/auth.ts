import { isUserRole } from "@/lib/domain-types";
import { getPublicEnvStatus } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthUserContext } from "@/lib/auth-state";

export async function getCurrentUserContext(): Promise<AuthUserContext | null> {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("app_user_profile")
      .select("display_name, role_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let role: AuthUserContext["role"] = "user";

    if (profile?.role_id) {
      const { data: roleRecord } = await supabase
        .from("role")
        .select("key")
        .eq("id", profile.role_id)
        .maybeSingle();

      if (isUserRole(roleRecord?.key)) {
        role = roleRecord.key;
      }
    }

    return {
      email: user.email ?? "Unknown user",
      displayName: profile?.display_name ?? null,
      role,
    };
  } catch {
    return null;
  }
}
