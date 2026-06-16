import { writeAuditLog } from "@/lib/audit-log";
import type { AssetInsert, AssetUpdate } from "@/lib/assets/service";
import type { AssetStatus, UserRole } from "@/lib/domain-types";
import { getPublicEnvStatus } from "@/lib/env";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AssetFilters = {
  status?: AssetStatus | "all";
  locationId?: string;
  categoryId?: string;
  search?: string;
  includeArchived?: boolean;
};

export async function listAssetCategories(includeArchived: boolean, role: UserRole) {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("asset_category").select("*").order("name", { ascending: true });

  if (!includeArchived || role !== "system_admin") {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data;
}

export async function listAssets(filters: AssetFilters, role: UserRole) {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("asset").select("*").order("updated_at", { ascending: false });

  if (!filters.includeArchived || role !== "system_admin") {
    query = query.is("archived_at", null);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.locationId) {
    query = query.eq("current_location_id", filters.locationId);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.search) {
    query = query.or(
      `asset_name.ilike.%${filters.search}%,unique_asset_id.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data;
}

export async function getAssetById(id: string) {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("asset").select("*").eq("id", id).maybeSingle();

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

export function createSupabaseAssetDependencies() {
  return {
    async insertAsset(payload: AssetInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.from("asset").insert(payload).select("*").single();

      if (error) {
        return err(error.message);
      }

      return ok(data);
    },
    async updateAsset(id: string, payload: AssetUpdate) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("asset")
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
