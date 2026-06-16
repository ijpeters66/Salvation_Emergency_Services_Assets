import {
  BarChart3,
  FileClock,
  Gauge,
  MapPinned,
  Package,
  PackageCheck,
  Settings,
  Truck,
  Wrench,
} from "lucide-react";

export const appNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Gauge,
    description: "Operational overview, alerts, and recent activity.",
    adminOnly: false,
  },
  {
    title: "Locations",
    href: "/locations",
    icon: MapPinned,
    description: "Warehouses, storage facilities, and temporary deployment sites.",
    adminOnly: false,
  },
  {
    title: "Assets",
    href: "/assets",
    icon: Package,
    description: "Individual non-consumable assets, QR codes, status, and history.",
    adminOnly: false,
  },
  {
    title: "Consumables",
    href: "/consumables",
    icon: PackageCheck,
    description: "Batch stock, quantities on hand, FIFO issuing, and thresholds.",
    adminOnly: false,
  },
  {
    title: "Deployments",
    href: "/deployments",
    icon: Truck,
    description: "Operational deployments, assigned assets, and issued consumables.",
    adminOnly: false,
  },
  {
    title: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    description: "Schedules, service records, compliance dates, and reminders.",
    adminOnly: false,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Asset, stock, deployment, maintenance, audit, and export views.",
    adminOnly: false,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Users, categories, movement reasons, and system configuration.",
    adminOnly: true,
  },
  {
    title: "Audit",
    href: "/audit",
    icon: FileClock,
    description: "Review system activity, record changes, and compliance evidence.",
    adminOnly: true,
  },
] as const;

export const modulePlaceholders = {
  locations: {
    eyebrow: "Location management",
    title: "Locations",
    summary: "Manage warehouses, storage facilities, and temporary deployment locations.",
  },
  assets: {
    eyebrow: "Asset register",
    title: "Assets",
    summary: "Track individual assets, status, QR codes, parent assignments, and history.",
  },
  consumables: {
    eyebrow: "Consumable stock",
    title: "Consumables",
    summary: "Track batches, stock on hand, FIFO movements, thresholds, and traceability.",
  },
  deployments: {
    eyebrow: "Operational deployments",
    title: "Deployments",
    summary: "Plan, activate, return, and close deployments with asset and stock records.",
  },
  maintenance: {
    eyebrow: "Maintenance and compliance",
    title: "Maintenance",
    summary: "Record service schedules, completed maintenance, invoices, and expiry alerts.",
  },
  reports: {
    eyebrow: "Reporting and exports",
    title: "Reports",
    summary: "Generate operational reports and export PDF, XLSX, or CSV outputs.",
  },
  settings: {
    eyebrow: "System administration",
    title: "Settings",
    summary: "Configure users, roles, categories, thresholds, and system defaults.",
  },
  audit: {
    eyebrow: "Audit trail",
    title: "Audit",
    summary: "Review system activity, record changes, and compliance evidence.",
  },
} as const;

export const scanActions = [
  "View record",
  "Move asset",
  "Issue stock",
  "Record maintenance",
  "Assign to deployment",
] as const;

export const setupChecks = [
  "Next.js App Router",
  "TypeScript",
  "Tailwind CSS",
  "shadcn/ui conventions",
  "ESLint",
  "Prettier",
  "Vitest",
  "Playwright",
] as const;
