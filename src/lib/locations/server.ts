import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";
import type { LocationInsert, LocationUpdate } from "@/lib/locations/service";
import type { UserRole } from "@/lib/domain-types";
import { getPublicEnvStatus } from "@/lib/env";

export async function listLocations(includeArchived: boolean, role: UserRole) {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("location").select("*").order("name", { ascending: true });

  if (!includeArchived || role !== "system_admin") {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data;
}

export async function getLocationById(id: string) {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("location").select("*").eq("id", id).maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function getCurrentSupabaseUserId() {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export function createSupabaseLocationDependencies() {
  return {
    async insertLocation(payload: LocationInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.from("location").insert(payload).select("*").single();

      if (error) {
        return err(error.message);
      }

      return ok(data);
    },
    async updateLocation(id: string, payload: LocationUpdate) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("location")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return err(error.message);
      }

      return ok(data);
    },
    writeAuditLog,
  };
}
