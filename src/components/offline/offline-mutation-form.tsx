"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  createOfflineMutation,
  createOfflineOptimisticRecord,
  queueOfflineMutation,
  saveOptimisticRecord,
  type OfflineEntityType,
  type OfflineMutationOperation,
} from "@/lib/offline/indexed-db";
import { assetFormSchema, buildQrCodeValue } from "@/lib/assets/validation";
import { plantDetailsSchema } from "@/lib/assets/plant";
import { deploymentFormSchema } from "@/lib/deployments/service";
import { isStockMovementType } from "@/lib/domain-types";
import { locationFormSchema } from "@/lib/locations/validation";
import { maintenanceRecordSchema } from "@/lib/maintenance/records";
import { issuesToFieldErrors, FormValidationProvider, type FieldErrors } from "@/components/form-validation";

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

function validateOfflineMutation(entityType: OfflineEntityType, formData: FormData): FieldErrors {
  switch (entityType) {
    case "asset": {
      const uniqueAssetId = String(formData.get("uniqueAssetId") ?? "");
      const assetResult = assetFormSchema.safeParse({
        uniqueAssetId,
        assetName: formData.get("assetName"),
        categoryId: formData.get("categoryId"),
        currentLocationId: formData.get("currentLocationId"),
        status: formData.get("status"),
        qrCodeValue: String(formData.get("qrCodeValue") ?? "").trim() || buildQrCodeValue(uniqueAssetId),
        description: formData.get("description") ?? "",
        serialNumber: formData.get("serialNumber") ?? "",
        make: formData.get("make") ?? "",
        model: formData.get("model") ?? "",
        purchaseDate: formData.get("purchaseDate") ?? "",
        purchaseCost: formData.get("purchaseCost") ?? "",
        replacementValue: formData.get("replacementValue") ?? "",
        currentValue: formData.get("currentValue") ?? "",
        notes: formData.get("notes") ?? "",
      });
      const plantResult = plantDetailsSchema.safeParse({
        isPlant: formData.get("isPlant") === "on",
        registrationNumber: formData.get("registrationNumber") ?? "",
        registrationExpiry: formData.get("registrationExpiry") ?? "",
        insuranceExpiry: formData.get("insuranceExpiry") ?? "",
        roadworthyComplianceDate: formData.get("roadworthyComplianceDate") ?? "",
        odometerReading: formData.get("odometerReading") ?? "",
        hourMeterReading: formData.get("hourMeterReading") ?? "",
        fuelType: formData.get("fuelType") ?? "",
        serviceProvider: formData.get("serviceProvider") ?? "",
      });
      return {
        ...(assetResult.success ? {} : issuesToFieldErrors(assetResult.error.issues)),
        ...(plantResult.success ? {} : issuesToFieldErrors(plantResult.error.issues)),
      };
    }
    case "deployment": {
      const result = deploymentFormSchema.safeParse({
        deploymentId: formData.get("deploymentId"),
        deploymentName: formData.get("deploymentName"),
        purposeReason: formData.get("purposeReason"),
        deploymentLocationSite: formData.get("deploymentLocationSite"),
        teamName: formData.get("teamName"),
        teamLeader: formData.get("teamLeader") ?? "",
        contactNumber: formData.get("contactNumber") ?? "",
        startDatetime: formData.get("startDatetime"),
        expectedReturnDatetime: formData.get("expectedReturnDatetime") ?? "",
        actualReturnDatetime: formData.get("actualReturnDatetime") ?? "",
        status: formData.get("status"),
        notes: formData.get("notes") ?? "",
        damageFaultNotes: formData.get("damageFaultNotes") ?? "",
      });
      return result.success ? {} : issuesToFieldErrors(result.error.issues);
    }
    case "location": {
      const result = locationFormSchema.safeParse({
        name: formData.get("name"),
        type: formData.get("type"),
        address: formData.get("address") ?? "",
        state: formData.get("state") || "Victoria",
        notes: formData.get("notes") ?? "",
      });
      return result.success ? {} : issuesToFieldErrors(result.error.issues);
    }
    case "stock_movement": {
      const errors: FieldErrors = {};
      const movementType = String(formData.get("movementType") ?? "");
      const quantity = Number(formData.get("quantity") ?? 0);
      const reason = String(formData.get("reason") ?? "").trim();

      if (!isStockMovementType(movementType)) {
        errors.movementType = "Choose a stock movement type.";
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        errors.quantity = "Quantity must be greater than zero.";
      }
      if (!reason) {
        errors.reason = "Reason is required.";
      }

      return errors;
    }
    case "maintenance_record": {
      const result = maintenanceRecordSchema.safeParse({
        assetId: formData.get("assetId"),
        maintenanceScheduleId: formData.get("maintenanceScheduleId") ?? "",
        date: formData.get("date"),
        serviceType: formData.get("serviceType"),
        description: formData.get("description"),
        cost: formData.get("cost") ?? "",
        supplierProvider: formData.get("supplierProvider"),
        odometerHourReading: formData.get("odometerHourReading") ?? "",
        notes: formData.get("notes") ?? "",
      });
      return result.success ? {} : issuesToFieldErrors(result.error.issues);
    }
    default:
      return {};
  }
}

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const offlineStatusPath = useMemo(() => {
    const separator = redirectPath.includes("?") ? "&" : "?";
    return `${redirectPath}${separator}statusMessage=queued-offline`;
  }, [redirectPath]);

  return (
    <form
      action={action}
      className={className}
      onSubmit={async (event) => {
        const form = event.currentTarget;
        const formData = new FormData(form);
        const validationErrors = validateOfflineMutation(entityType, formData);
        setFieldErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
          event.preventDefault();
          return;
        }

        if (typeof navigator === "undefined" || navigator.onLine) {
          return;
        }

        event.preventDefault();

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
      <FormValidationProvider errors={fieldErrors}>{children}</FormValidationProvider>
    </form>
  );
}
