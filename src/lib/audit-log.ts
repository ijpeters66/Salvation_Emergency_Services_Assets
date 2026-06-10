import type { Database, Json } from "@/lib/database.types";
import { err, ok, type AppResult } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuditLogInsert = Database["public"]["Tables"]["audit_log"]["Insert"];

export type AuditLogInput = {
  userId: string;
  actionType: string;
  recordType: string;
  recordId: string;
  oldValue?: Json | null;
  newValue?: Json | null;
  deviceSource?: string | null;
  offlineSyncReference?: string | null;
};

export function buildAuditLogPayload(input: AuditLogInput): AuditLogInsert {
  return {
    user_id: input.userId,
    action_type: input.actionType,
    record_type: input.recordType,
    record_id: input.recordId,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
    device_source: input.deviceSource ?? null,
    offline_sync_reference: input.offlineSyncReference ?? null,
  };
}

export async function writeAuditLog(input: AuditLogInput): Promise<AppResult<AuditLogInsert>> {
  const payload = buildAuditLogPayload(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("audit_log").insert(payload);

  if (error) {
    return err(error.message);
  }

  return ok(payload);
}
