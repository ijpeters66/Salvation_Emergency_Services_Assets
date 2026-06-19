import { writeAuditLog } from "@/lib/audit-log";
import type { AssetMovementInsert } from "@/lib/assets/movement";
import type { AssetAssignmentInsert, AssetAssignmentUpdate } from "@/lib/assets/assignment";
import type { AssetInsert, AssetUpdate } from "@/lib/assets/service";
import type { PlantDetailsInsert } from "@/lib/assets/plant";
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
  plantOnly?: boolean;
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

  if (!filters.plantOnly) {
    return data;
  }

  const { data: plantRows, error: plantError } = await supabase
    .from("plant_details")
    .select("asset_id");

  if (plantError) {
    return [];
  }

  const plantAssetIds = new Set(plantRows.map((row) => row.asset_id));
  return data.filter((asset) => plantAssetIds.has(asset.id));
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

export async function getAssetByQrCodeValue(qrCodeValue: string) {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("asset")
    .select("*")
    .eq("qr_code_value", qrCodeValue)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function getPlantDetailsByAssetId(assetId: string) {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("plant_details")
    .select("*")
    .eq("asset_id", assetId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function listAssetMovements(assetId: string) {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("asset_movement")
    .select("*")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data;
}

export async function listAssetAssignments(assetId: string) {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("asset_assignment")
    .select("*")
    .or(`parent_asset_id.eq.${assetId},child_asset_id.eq.${assetId}`)
    .order("assigned_at", { ascending: false });

  if (error) {
    return [];
  }

  return data;
}

export async function getAssetAssignmentById(id: string) {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("asset_assignment")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function listActiveAssignmentEdges() {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("asset_assignment")
    .select("parent_asset_id, child_asset_id")
    .is("unassigned_at", null);

  if (error) {
    return [];
  }

  return data.map((assignment) => ({
    parentAssetId: assignment.parent_asset_id,
    childAssetId: assignment.child_asset_id,
  }));
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
    async insertMovement(payload: AssetMovementInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("asset_movement")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        return err(error.message);
      }

      return ok(data);
    },
    async getActiveChildAssets(parentAssetId: string) {
      const supabase = await createSupabaseServerClient();
      const { data: assignments, error: assignmentError } = await supabase
        .from("asset_assignment")
        .select("child_asset_id")
        .eq("parent_asset_id", parentAssetId)
        .is("unassigned_at", null);

      if (assignmentError) {
        return err(assignmentError.message);
      }

      const childIds = assignments.map((assignment) => assignment.child_asset_id);

      if (childIds.length === 0) {
        return ok([]);
      }

      const { data, error } = await supabase.from("asset").select("*").in("id", childIds);

      if (error) {
        return err(error.message);
      }

      return ok(data);
    },
    async insertAssignment(payload: AssetAssignmentInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("asset_assignment")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        return err(error.message);
      }

      return ok(data);
    },
    async updateAssignment(id: string, payload: AssetAssignmentUpdate) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("asset_assignment")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return err(error.message);
      }

      return ok(data);
    },
    async upsertPlantDetails(payload: PlantDetailsInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("plant_details")
        .upsert(payload, { onConflict: "asset_id" })
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
