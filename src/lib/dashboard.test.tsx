import { renderToStaticMarkup } from "react-dom/server";
import { AlertTriangle } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { DashboardTile } from "@/components/dashboard/dashboard-tile";
import {
  aggregateAssetsByStatus,
  countAssetsOverdueForReturn,
  countMaintenanceAlerts,
  countPlantExpiryAlerts,
  getDashboardData,
} from "@/lib/dashboard";

describe("dashboard aggregations", () => {
  it("aggregates assets by status", () => {
    const result = aggregateAssetsByStatus([
      {
        id: "asset-1",
        unique_asset_id: "A-1",
        qr_code_value: "QR1",
        asset_name: "Generator",
        category_id: "cat-1",
        description: null,
        serial_number: null,
        make: null,
        model: null,
        purchase_date: null,
        purchase_cost: null,
        replacement_value: null,
        current_value: null,
        current_location_id: "loc-1",
        status: "available",
        notes: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "user-1",
        updated_by: "user-1",
      },
      {
        id: "asset-2",
        unique_asset_id: "A-2",
        qr_code_value: "QR2",
        asset_name: "Trailer",
        category_id: "cat-1",
        description: null,
        serial_number: null,
        make: null,
        model: null,
        purchase_date: null,
        purchase_cost: null,
        replacement_value: null,
        current_value: null,
        current_location_id: "loc-1",
        status: "deployed",
        notes: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "user-1",
        updated_by: "user-1",
      },
      {
        id: "asset-3",
        unique_asset_id: "A-3",
        qr_code_value: "QR3",
        asset_name: "Spare kit",
        category_id: "cat-1",
        description: null,
        serial_number: null,
        make: null,
        model: null,
        purchase_date: null,
        purchase_cost: null,
        replacement_value: null,
        current_value: null,
        current_location_id: "loc-1",
        status: "available",
        notes: null,
        archived_at: null,
        created_at: "",
        updated_at: "",
        created_by: "user-1",
        updated_by: "user-1",
      },
    ]);

    expect(result).toEqual([
      { count: 2, href: "/assets?status=available", label: "available", status: "available" },
      { count: 1, href: "/assets?status=deployed", label: "deployed", status: "deployed" },
    ]);
  });

  it("counts maintenance alerts using plant readings", () => {
    const result = countMaintenanceAlerts(
      [
        {
          id: "schedule-1",
          asset_id: "asset-1",
          maintenance_type: "Service",
          service_interval_date: null,
          service_interval_odometer: 5000,
          service_interval_hours: null,
          next_service_due_date: null,
          next_service_due_reading: 12000,
          service_provider: null,
          reminder_threshold_days: 30,
          status: "active",
          created_at: "",
          updated_at: "",
          created_by: "user-1",
          updated_by: "user-1",
        },
        {
          id: "schedule-2",
          asset_id: "asset-2",
          maintenance_type: "Inspection",
          service_interval_date: null,
          service_interval_odometer: null,
          service_interval_hours: null,
          next_service_due_date: "2026-06-01",
          next_service_due_reading: null,
          service_provider: null,
          reminder_threshold_days: 30,
          status: "active",
          created_at: "",
          updated_at: "",
          created_by: "user-1",
          updated_by: "user-1",
        },
      ],
      new Map([
        [
          "asset-1",
          {
            id: "asset-1",
            unique_asset_id: "A-1",
            qr_code_value: "QR1",
            asset_name: "Generator",
            category_id: "cat-1",
            description: null,
            serial_number: null,
            make: null,
            model: null,
            purchase_date: null,
            purchase_cost: null,
            replacement_value: null,
            current_value: null,
            current_location_id: "loc-1",
            status: "available",
            notes: null,
            archived_at: null,
            created_at: "",
            updated_at: "",
            created_by: "user-1",
            updated_by: "user-1",
          },
        ],
      ]),
      new Map([
        [
          "asset-1",
          {
            asset_id: "asset-1",
            registration_number: null,
            registration_expiry: null,
            insurance_expiry: null,
            roadworthy_compliance_date: null,
            odometer_reading: 11800,
            hour_meter_reading: null,
            fuel_type: null,
            service_provider: null,
            created_at: "",
            updated_at: "",
            created_by: "user-1",
            updated_by: "user-1",
          },
        ],
      ]),
    );

    expect(result.due_soon).toBe(1);
    expect(result.overdue).toBe(1);
  });

  it("counts plant expiry alerts and overdue returns", () => {
    expect(
      countPlantExpiryAlerts([
        {
          asset_id: "asset-1",
          registration_number: null,
          registration_expiry: "2026-06-10",
          insurance_expiry: "2026-07-05",
          roadworthy_compliance_date: null,
          odometer_reading: null,
          hour_meter_reading: null,
          fuel_type: null,
          service_provider: null,
          created_at: "",
          updated_at: "",
          created_by: "user-1",
          updated_by: "user-1",
        },
      ]),
    ).toBeGreaterThan(0);

    expect(
      countAssetsOverdueForReturn(
        [
          {
            id: "deployment-1",
            deployment_id: "D-1",
            deployment_name: "Flood response",
            purpose_reason: "",
            deployment_location_site: "",
            team_name: "",
            team_leader: null,
            contact_number: null,
            start_datetime: "2026-06-01T00:00:00.000Z",
            expected_return_datetime: "2026-06-10T00:00:00.000Z",
            actual_return_datetime: null,
            status: "active",
            notes: null,
            damage_fault_notes: null,
            created_at: "",
            updated_at: "",
            created_by: "user-1",
          },
        ],
        new Date("2026-06-25T00:00:00.000Z"),
      ),
    ).toBe(1);
  });
});

describe("dashboard query service", () => {
  it("builds dashboard data from existing service outputs", async () => {
    const data = await getDashboardData("user", {
      listAssets: vi.fn().mockResolvedValue([
        {
          id: "asset-1",
          unique_asset_id: "A-1",
          qr_code_value: "QR1",
          asset_name: "Generator",
          category_id: "cat-1",
          description: null,
          serial_number: null,
          make: null,
          model: null,
          purchase_date: null,
          purchase_cost: null,
          replacement_value: null,
          current_value: 1000,
          current_location_id: "loc-1",
          status: "available",
          notes: null,
          archived_at: null,
          created_at: "",
          updated_at: "",
          created_by: "user-1",
          updated_by: "user-1",
        },
      ]),
      listPlantDetails: vi.fn().mockResolvedValue([]),
      listRecentAssetMovements: vi.fn().mockResolvedValue([
        {
          id: "move-1",
          asset_id: "asset-1",
          from_location_id: "loc-1",
          to_location_id: "loc-2",
          from_status: "available",
          to_status: "deployed",
          reason: "Deployment",
          notes: null,
          created_at: "2026-06-25T00:00:00.000Z",
          created_by: "user-1",
        },
      ]),
      listConsumableBatches: vi.fn().mockResolvedValue([
        {
          id: "batch-1",
          item_id: "item-1",
          batch_lot_number: "LOT-1",
          quantity_received: 10,
          quantity_on_hand: 2,
          unit_cost: 20,
          replacement_cost: null,
          date_received: "2026-06-01",
          supplier_donor: null,
          expiry_date: null,
          location_id: "loc-1",
          qr_code_value: "QRB1",
          archived_at: null,
          created_at: "",
          updated_at: "",
          created_by: "user-1",
          updated_by: "user-1",
        },
      ]),
      listConsumableItems: vi.fn().mockResolvedValue([
        {
          id: "item-1",
          name: "Bandage",
          category_id: "cat-1",
          description: null,
          archived_at: null,
          created_at: "",
          updated_at: "",
          created_by: "user-1",
          updated_by: "user-1",
        },
      ]),
      listRecentStockMovements: vi.fn().mockResolvedValue([
        {
          id: "stock-1",
          consumable_batch_id: "batch-1",
          movement_type: "issued",
          quantity: 3,
          from_location_id: "loc-1",
          to_location_id: null,
          reason: "Deployment issue",
          related_deployment_id: null,
          notes: null,
          created_at: "2026-06-25T00:00:00.000Z",
          created_by: "user-1",
        },
      ]),
      listStockThresholds: vi.fn().mockResolvedValue([
        {
          id: "threshold-1",
          consumable_item_id: "item-1",
          location_id: "loc-1",
          minimum_quantity: 5,
          created_at: "",
          updated_at: "",
          created_by: "user-1",
          updated_by: "user-1",
        },
      ]),
      listDeployments: vi.fn().mockResolvedValue([]),
      listMaintenanceSchedules: vi.fn().mockResolvedValue([]),
    });

    expect(data.totalAssets).toBe(1);
    expect(data.lowStockItems).toBe(1);
    expect(data.metrics.some((metric) => metric.label === "Low Stock Items")).toBe(true);
    expect(data.recentAssetMovements[0]?.title).toBe("Generator");
    expect(data.recentStockMovements[0]?.title).toBe("Bandage");
  });
});

describe("DashboardTile", () => {
  it("renders a clickable alert tile", () => {
    const markup = renderToStaticMarkup(
      <DashboardTile
        description="Threshold alerts that need replenishment soon."
        href="/consumables?alert=low-stock"
        icon={AlertTriangle}
        label="Low Stock Items"
        tone="alert"
        value="3"
      />,
    );

    expect(markup).toContain("Low Stock Items");
    expect(markup).toContain("/consumables?alert=low-stock");
    expect(markup).toContain("3");
  });
});
