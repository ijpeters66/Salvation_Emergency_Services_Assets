import { writeAuditLog } from "@/lib/audit-log";
import type {
  ConsumableBatchInsert,
  ConsumableBatchUpdate,
  ConsumableItemInsert,
} from "@/lib/consumables/service";
import type { StockMovementInsert } from "@/lib/consumables/stock-movement";
import type { UserRole } from "@/lib/domain-types";
import { getPublicEnvStatus } from "@/lib/env";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConsumableFilters = {
  locationId?: string;
  categoryId?: string;
  search?: string;
  lowQuantity?: boolean;
  includeArchived?: boolean;
};

export async function listConsumableCategories(includeArchived: boolean, role: UserRole) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("consumable_category").select("*").order("name");
  if (!includeArchived || role !== "system_admin") query = query.is("archived_at", null);
  const { data, error } = await query;
  return error ? [] : data;
}

export async function listConsumableItems(includeArchived: boolean, role: UserRole) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("consumable_item").select("*").order("name");
  if (!includeArchived || role !== "system_admin") query = query.is("archived_at", null);
  const { data, error } = await query;
  return error ? [] : data;
}

export async function listConsumableBatches(filters: ConsumableFilters, role: UserRole) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("consumable_batch")
    .select("*")
    .order("updated_at", { ascending: false });
  if (!filters.includeArchived || role !== "system_admin") query = query.is("archived_at", null);
  if (filters.locationId) query = query.eq("location_id", filters.locationId);
  if (filters.lowQuantity) query = query.lte("quantity_on_hand", 0);
  if (filters.search) {
    query = query.or(
      `batch_lot_number.ilike.%${filters.search}%,supplier_donor.ilike.%${filters.search}%,qr_code_value.ilike.%${filters.search}%`,
    );
  }
  const { data, error } = await query;
  if (error) return [];
  return filters.categoryId ? data : data;
}

export async function listIssueEligibleBatches(itemId: string, locationId: string) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("consumable_batch")
    .select("*")
    .eq("item_id", itemId)
    .eq("location_id", locationId)
    .is("archived_at", null)
    .gt("quantity_on_hand", 0);
  return error ? [] : data;
}

export async function getConsumableBatchById(id: string) {
  if (!getPublicEnvStatus().configured) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("consumable_batch")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return error ? null : data;
}

export async function listStockMovements(batchId: string) {
  if (!getPublicEnvStatus().configured) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("stock_movement")
    .select("*")
    .eq("consumable_batch_id", batchId)
    .order("created_at", { ascending: false });
  return error ? [] : data;
}

export async function getCurrentSupabaseUserId() {
  if (!getPublicEnvStatus().configured) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function createSupabaseConsumableDependencies() {
  return {
    async insertItem(payload: ConsumableItemInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("consumable_item")
        .insert(payload)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async insertBatch(payload: ConsumableBatchInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("consumable_batch")
        .insert(payload)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async updateBatch(id: string, payload: ConsumableBatchUpdate) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("consumable_batch")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    async insertStockMovement(payload: StockMovementInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("stock_movement")
        .insert(payload)
        .select("*")
        .single();
      return error ? err(error.message) : ok(data);
    },
    writeAuditLog,
  };
}
