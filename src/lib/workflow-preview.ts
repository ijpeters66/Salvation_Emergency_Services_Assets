import { buildLocationQrCodeValue } from "@/lib/qr";
import { resolveScanDestination, type QrScanAction } from "@/lib/scan";

export const previewAssetCategories = [
  {
    id: "preview-asset-cat-1",
    name: "Vehicles",
    description: "Response vehicles and tow-capable assets.",
    archived_at: null,
  },
  {
    id: "preview-asset-cat-2",
    name: "Plant",
    description: "Portable generators and support equipment.",
    archived_at: null,
  },
] as const;

export const previewLocations = [
  {
    id: "preview-loc-1",
    name: "Ballarat depot",
    type: "warehouse",
    address: "102 Depot Road, Ballarat VIC",
    state: "Victoria",
    notes: "Primary warehousing and dispatch point.",
    archived_at: null,
    updated_at: "2026-06-20T08:00:00.000Z",
    qr_code_value: buildLocationQrCodeValue("preview-loc-1"),
  },
  {
    id: "preview-loc-2",
    name: "Hamilton staging",
    type: "temporary_deployment",
    address: "17 Relief Lane, Hamilton VIC",
    state: "Victoria",
    notes: "Temporary field staging location.",
    archived_at: null,
    updated_at: "2026-06-21T08:00:00.000Z",
    qr_code_value: buildLocationQrCodeValue("preview-loc-2"),
  },
] as const;

export const previewAssets = [
  {
    id: "preview-1",
    unique_asset_id: "TRAILER-001",
    qr_code_value: "SAES-ASSET:TRAILER-001",
    asset_name: "Support trailer",
    category_id: "preview-asset-cat-1",
    current_location_id: "preview-loc-2",
    status: "deployed",
    current_value: 14500,
    purchase_cost: 18000,
    replacement_value: 21000,
    purchase_date: "2024-03-14",
    serial_number: "TRL-001-XY",
    make: "Haulmark",
    model: "Response 12",
    description: "Towable logistics trailer configured for community response.",
    notes: "Assigned to Hamilton flood support deployment.",
    archived_at: null,
  },
  {
    id: "preview-2",
    unique_asset_id: "GEN-002",
    qr_code_value: "SAES-ASSET:GEN-002",
    asset_name: "Generator",
    category_id: "preview-asset-cat-2",
    current_location_id: "preview-loc-1",
    status: "available",
    current_value: 3800,
    purchase_cost: 5200,
    replacement_value: 5600,
    purchase_date: "2025-01-08",
    serial_number: "GEN-002-ZA",
    make: "Honda",
    model: "EU70is",
    description: "Portable generator for field power support.",
    notes: "Stored as child equipment under the support trailer when deployed.",
    archived_at: null,
  },
] as const;

export const previewAssetAssignments = [
  {
    id: "preview-assignment-1",
    parent_asset_id: "preview-1",
    child_asset_id: "preview-2",
    assigned_at: "2026-06-24T07:30:00.000Z",
    unassigned_at: null,
  },
] as const;

export const previewAssetMovements = [
  {
    id: "preview-move-1",
    asset_id: "preview-1",
    reason: "Flood Response",
    to_status: "deployed",
    from_location_id: "preview-loc-1",
    to_location_id: "preview-loc-2",
    notes: "Checked out to Hamilton flood response.",
    created_at: "2026-06-24T08:15:00.000Z",
  },
  {
    id: "preview-move-2",
    asset_id: "preview-2",
    reason: "Maintenance",
    to_status: "available",
    from_location_id: "preview-loc-2",
    to_location_id: "preview-loc-1",
    notes: "Returned after generator service.",
    created_at: "2026-06-25T09:45:00.000Z",
  },
] as const;

export const previewPlantDetails = [
  {
    asset_id: "preview-2",
    registration_number: "1SAES2",
    registration_expiry: "2026-07-15",
    insurance_expiry: "2026-07-03",
    roadworthy_compliance_date: "2026-06-29",
    odometer_reading: 11840,
    hour_meter_reading: 126.5,
    fuel_type: "Petrol",
    service_provider: "Western District Fleet",
    created_at: "2026-01-08T08:00:00.000Z",
    updated_at: "2026-06-24T08:00:00.000Z",
    created_by: "preview-user",
    updated_by: "preview-user",
  },
] as const;

export const previewConsumableCategories = [
  {
    id: "preview-cons-cat-1",
    name: "Material Aid",
    description: "Material aid and relief consumables.",
    archived_at: null,
  },
  {
    id: "preview-cons-cat-2",
    name: "PPE",
    description: "Protective equipment and field consumables.",
    archived_at: null,
  },
  {
    id: "preview-cons-cat-3",
    name: "Food/Water",
    description: "Food, drinking water, and refreshment supplies.",
    archived_at: null,
  },
] as const;

export const previewConsumableItems = [
  {
    id: "preview-item-1",
    name: "Trauma dressing",
    category_id: "preview-cons-cat-1",
    description: "Sterile field trauma dressing.",
    archived_at: null,
  },
  {
    id: "preview-item-2",
    name: "Saline",
    category_id: "preview-cons-cat-1",
    description: "500ml sterile saline.",
    archived_at: null,
  },
] as const;

export const previewConsumableBatches = [
  {
    id: "preview-batch-1",
    item_id: "preview-item-1",
    batch_lot_number: "LOT-A",
    quantity_received: 12,
    quantity_on_hand: 2,
    unit_cost: 18,
    replacement_cost: 20,
    date_received: "2026-06-01",
    supplier_donor: "Regional Med Supply",
    expiry_date: "2027-01-01",
    location_id: "preview-loc-1",
    qr_code_value: "SAES-CONSUMABLE:TRAUMA-DRESSING:LOT-A",
    archived_at: null,
    updated_at: "2026-06-25T10:00:00.000Z",
  },
  {
    id: "preview-batch-2",
    item_id: "preview-item-2",
    batch_lot_number: "LOT-B",
    quantity_received: 8,
    quantity_on_hand: 0,
    unit_cost: 12,
    replacement_cost: 15,
    date_received: "2026-06-03",
    supplier_donor: "Regional Med Supply",
    expiry_date: "2027-03-01",
    location_id: "preview-loc-2",
    qr_code_value: "SAES-CONSUMABLE:SALINE:LOT-B",
    archived_at: null,
    updated_at: "2026-06-24T16:00:00.000Z",
  },
] as const;

export const previewStockThresholds = [
  {
    id: "preview-threshold-1",
    consumable_item_id: "preview-item-1",
    location_id: "preview-loc-1",
    minimum_quantity: 4,
  },
  {
    id: "preview-threshold-2",
    consumable_item_id: "preview-item-2",
    location_id: "preview-loc-2",
    minimum_quantity: 3,
  },
] as const;

export const previewStockMovements = [
  {
    id: "preview-stock-move-1",
    consumable_batch_id: "preview-batch-1",
    movement_type: "issued",
    quantity: 4,
    from_location_id: "preview-loc-1",
    to_location_id: "preview-loc-2",
    related_deployment_id: "preview-deployment-1",
    reason: "Flood Response",
    created_at: "2026-06-24T09:15:00.000Z",
  },
  {
    id: "preview-stock-move-2",
    consumable_batch_id: "preview-batch-2",
    movement_type: "received",
    quantity: 12,
    from_location_id: null,
    to_location_id: "preview-loc-2",
    related_deployment_id: null,
    reason: "Stock Transfer",
    created_at: "2026-06-23T12:00:00.000Z",
  },
] as const;

export const previewDeployments = [
  {
    id: "preview-deployment-1",
    deployment_id: "DEP-100",
    deployment_name: "Hamilton flood support",
    purpose_reason: "Flood Response",
    deployment_location_site: "Hamilton relief centre",
    team_name: "Regional Response Team",
    team_leader: "Alex Peters",
    contact_number: "0400 000 100",
    start_datetime: "2026-06-24T08:00:00.000Z",
    expected_return_datetime: "2026-06-28T18:00:00.000Z",
    actual_return_datetime: null,
    status: "active",
    notes: "Community support deployment with trailer and consumable issue.",
    damage_fault_notes: null,
  },
] as const;

export const previewDeploymentAssets = [
  {
    id: "preview-deployment-asset-1",
    deployment_id: "preview-deployment-1",
    asset_id: "preview-1",
    checked_out_at: "2026-06-24T08:20:00.000Z",
    checked_in_at: null,
    notes: "Trailer checked out with generator packed as child asset.",
  },
] as const;

export const previewDeploymentConsumables = [
  {
    id: "preview-deployment-consumable-1",
    deployment_id: "preview-deployment-1",
    consumable_batch_id: "preview-batch-1",
    quantity_issued: 4,
    issued_at: "2026-06-24T09:20:00.000Z",
    notes: "Issued using FIFO from Ballarat depot.",
  },
] as const;

export const previewMaintenanceSchedules = [
  {
    id: "preview-schedule-1",
    asset_id: "preview-2",
    maintenance_type: "Generator service",
    service_interval_date: 180,
    service_interval_odometer: 5000,
    service_interval_hours: 50,
    next_service_due_date: "2026-06-30",
    next_service_due_reading: 12000,
    service_provider: "Western District Fleet",
    reminder_threshold_days: 30,
    status: "active",
    archived_at: null,
    created_at: "2026-05-01T08:00:00.000Z",
    updated_at: "2026-06-24T08:00:00.000Z",
    created_by: "preview-user",
    updated_by: "preview-user",
  },
] as const;

export const previewMaintenanceRecords = [
  {
    id: "preview-record-1",
    asset_id: "preview-2",
    maintenance_date: "2026-06-25",
    maintenance_type: "Generator service",
    provider: "Western District Fleet",
    cost: 320,
    notes: "Routine service and inspection completed.",
  },
] as const;

export const previewMaintenanceVendors = [
  {
    id: "preview-vendor-1",
    business_name: "Western District Fleet",
    contact_name: "Sam Taylor",
    phone: "03 5550 1200",
    email: "service@wdfleet.example",
    address: "44 Industrial Drive, Ballarat VIC",
    website: "https://wdfleet.example",
    notes: "Vehicles, trailers, and portable generators.",
    archived_at: null,
  },
] as const;

export const previewMovementReasons = [
  "Flood Response",
  "Fire Response",
  "Training Exercise",
  "Community Support",
  "Stock Transfer",
  "Maintenance",
  "Disposal/Write-Off",
] as const;

export const previewAuditEntries = [
  {
    id: "preview-audit-1",
    created_at: "2026-06-24T08:05:00.000Z",
    userLabel: "Alex Admin",
    user_id: "preview-admin",
    action_type: "location.create",
    record_type: "location",
    record_id: "preview-loc-2",
    recordHref: "/locations?preview=1",
    old_value: null,
    new_value: { name: "Hamilton staging", type: "temporary_deployment" },
  },
  {
    id: "preview-audit-2",
    created_at: "2026-06-24T08:15:00.000Z",
    userLabel: "Operations User",
    user_id: "preview-user",
    action_type: "asset.create",
    record_type: "asset",
    record_id: "preview-1",
    recordHref: "/assets/preview-1?preview=1",
    old_value: null,
    new_value: { asset_name: "Support trailer", status: "deployed" },
  },
  {
    id: "preview-audit-3",
    created_at: "2026-06-24T09:20:00.000Z",
    userLabel: "Operations User",
    user_id: "preview-user",
    action_type: "deployment.update",
    record_type: "deployment",
    record_id: "preview-deployment-1",
    recordHref: "/deployments/preview-deployment-1?preview=1",
    old_value: { status: "planned" },
    new_value: { status: "active" },
  },
] as const;

export function getPreviewLocationOptions() {
  return previewLocations.map((location) => ({
    value: location.id,
    label: location.name,
    meta: location.type,
  }));
}

export function getPreviewAssetById(id: string) {
  return previewAssets.find((asset) => asset.id === id) ?? null;
}

export function getPreviewConsumableBatchById(id: string) {
  return previewConsumableBatches.find((batch) => batch.id === id) ?? null;
}

export function getPreviewConsumableItemById(id: string) {
  return previewConsumableItems.find((item) => item.id === id) ?? null;
}

export function getPreviewDeploymentById(id: string) {
  return previewDeployments.find((deployment) => deployment.id === id) ?? null;
}

export function getPreviewLocationById(id: string) {
  return previewLocations.find((location) => location.id === id) ?? null;
}

export function resolvePreviewScanDestination(payload: string, action: QrScanAction) {
  const asset = previewAssets.find((item) => item.qr_code_value === payload);
  if (asset) {
    const destination = resolveScanDestination(
      { recordType: "asset", recordKey: asset.unique_asset_id, payload },
      action,
      { id: asset.id, recordType: "asset" },
    );
    return destination ? `${destination}?preview=1` : null;
  }

  const batch = previewConsumableBatches.find((item) => item.qr_code_value === payload);
  if (batch) {
    const item = previewConsumableItems.find((candidate) => candidate.id === batch.item_id);
    const destination = resolveScanDestination(
      {
        recordType: "consumable_batch",
        itemKey: item?.name ?? batch.item_id,
        recordKey: batch.batch_lot_number,
        payload,
      },
      action,
      { id: batch.id, recordType: "consumable_batch" },
    );
    return destination ? `${destination}?preview=1` : null;
  }

  const location = previewLocations.find((item) => item.qr_code_value === payload);
  if (location) {
    const destination = resolveScanDestination(
      { recordType: "location", recordKey: location.id.toUpperCase(), payload },
      action,
      { id: location.id, recordType: "location" },
    );
    return destination ? `${destination}?preview=1` : null;
  }

  return null;
}
