import type { Database } from "@/lib/database.types";

export type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"];

export type AuditFilters = {
  userId?: string;
  actionType?: string;
  recordType?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AuditListEntry = AuditLogRow & {
  userLabel: string;
  recordHref: string | null;
};

function humanizeSegments(value: string) {
  return value
    .split(/[_\-.]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatAuditAction(actionType: string) {
  return humanizeSegments(actionType);
}

export function formatAuditRecordType(recordType: string) {
  return humanizeSegments(recordType);
}

export function formatAuditTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getAuditRecordHref(recordType: string, recordId: string) {
  switch (recordType) {
    case "asset":
      return `/assets/${recordId}`;
    case "location":
      return `/locations/${recordId}`;
    case "deployment":
      return `/deployments/${recordId}`;
    case "maintenance_record":
      return `/maintenance/records/${recordId}`;
    case "consumable_batch":
      return `/consumables/${recordId}`;
    case "consumable_item":
      return `/consumables/items/${recordId}`;
    case "plant_details":
      return `/assets/${recordId}`;
    default:
      return null;
  }
}

export function filterAuditEntries(entries: AuditListEntry[], filters: AuditFilters) {
  return entries.filter((entry) => {
    if (filters.userId && entry.user_id !== filters.userId) {
      return false;
    }

    if (filters.actionType && entry.action_type !== filters.actionType) {
      return false;
    }

    if (filters.recordType && entry.record_type !== filters.recordType) {
      return false;
    }

    if (filters.dateFrom) {
      const start = new Date(`${filters.dateFrom}T00:00:00`);
      if (new Date(entry.created_at) < start) {
        return false;
      }
    }

    if (filters.dateTo) {
      const end = new Date(`${filters.dateTo}T23:59:59.999`);
      if (new Date(entry.created_at) > end) {
        return false;
      }
    }

    return true;
  });
}

export function formatAuditJson(value: AuditLogRow["old_value"] | AuditLogRow["new_value"]) {
  if (value == null) {
    return "No value recorded.";
  }

  return JSON.stringify(value, null, 2);
}
