"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo } from "react";

import {
  createOfflineMutation,
  createOfflineOptimisticRecord,
  queueOfflineMutation,
  saveOptimisticRecord,
  type OfflineEntityType,
  type OfflineMutationOperation,
} from "@/lib/offline/indexed-db";

type OfflineMutationFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  entityType: OfflineEntityType;
  operationType: OfflineMutationOperation;
  redirectPath: string;
  entityIdField?: string;
  displayLabelFields?: string[];
  parentEntityType?: OfflineEntityType;
  parentEntityIdField?: string;
};

function formDataToObject(formData: FormData) {
  const output: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      output[key] = value;
    }
  }

  return output;
}

function getDisplayLabel(formData: FormData, fields: string[]) {
  for (const field of fields) {
    const value = String(formData.get(field) ?? "").trim();

    if (value.length > 0) {
      return value;
    }
  }

  return "Pending offline change";
}

export function OfflineMutationForm({
  action,
  children,
  className,
  entityType,
  operationType,
  redirectPath,
  entityIdField = "id",
  displayLabelFields = [],
  parentEntityType,
  parentEntityIdField,
}: OfflineMutationFormProps) {
  const router = useRouter();
  const offlineStatusPath = useMemo(() => {
    const separator = redirectPath.includes("?") ? "&" : "?";
    return `${redirectPath}${separator}statusMessage=queued-offline`;
  }, [redirectPath]);

  return (
    <form
      action={action}
      className={className}
      onSubmit={async (event) => {
        if (typeof navigator === "undefined" || navigator.onLine) {
          return;
        }

        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);
        const entityId =
          (operationType === "update" ? String(formData.get(entityIdField) ?? "") : "") ||
          `offline-${crypto.randomUUID()}`;
        const displayLabel = getDisplayLabel(formData, displayLabelFields);
        const payload = formDataToObject(formData);
        const parentEntityId = parentEntityIdField ? String(formData.get(parentEntityIdField) ?? "") : "";

        const mutation = createOfflineMutation({
          operation_type: operationType,
          entity_type: entityType,
          entity_id: entityId,
          payload,
          display_label: displayLabel,
          route: redirectPath,
          parent_entity_type: parentEntityType ?? null,
          parent_entity_id: parentEntityId || null,
        });

        await queueOfflineMutation(mutation);
        await saveOptimisticRecord(
          createOfflineOptimisticRecord({
            entity_type: entityType,
            entity_id: entityId,
            display_label: displayLabel,
            route: redirectPath,
            payload,
            parent_entity_type: parentEntityType ?? null,
            parent_entity_id: parentEntityId || null,
          }),
        );

        router.push(offlineStatusPath);
        router.refresh();
      }}
    >
      {children}
    </form>
  );
}
