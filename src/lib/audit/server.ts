import { getPublicEnvStatus } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { filterAuditEntries, getAuditRecordHref, type AuditFilters, type AuditListEntry } from "@/lib/audit";

export async function listAuditLogs(filters: AuditFilters = {}): Promise<AuditListEntry[]> {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(250);

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters.actionType) {
    query = query.eq("action_type", filters.actionType);
  }

  if (filters.recordType) {
    query = query.eq("record_type", filters.recordType);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  }

  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59.999`);
  }

  const [{ data: auditRows, error: auditError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      query,
      supabase.from("app_user_profile").select("user_id, display_name"),
    ]);

  if (auditError || profilesError || !auditRows) {
    return [];
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id,
      profile.display_name?.trim() || `User ${profile.user_id.slice(0, 8)}`,
    ]),
  );

  const entries = auditRows.map((row) => ({
    ...row,
    userLabel: profileMap.get(row.user_id) ?? `User ${row.user_id.slice(0, 8)}`,
    recordHref: getAuditRecordHref(row.record_type, row.record_id),
  }));

  return filterAuditEntries(entries, filters);
}

export async function getAuditFilterOptions() {
  const entries = await listAuditLogs();

  const users = new Map<string, string>();
  const actionTypes = new Set<string>();
  const recordTypes = new Set<string>();

  for (const entry of entries) {
    users.set(entry.user_id, entry.userLabel);
    actionTypes.add(entry.action_type);
    recordTypes.add(entry.record_type);
  }

  return {
    users: Array.from(users.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    actionTypes: Array.from(actionTypes).sort(),
    recordTypes: Array.from(recordTypes).sort(),
  };
}
