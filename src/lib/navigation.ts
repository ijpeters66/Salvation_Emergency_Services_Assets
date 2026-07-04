export const appNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    iconName: "Gauge",
    description: "Live summary, urgent work, and recent activity.",
    adminOnly: false,
  },
  {
    title: "Scan",
    href: "/scan",
    iconName: "QrCode",
    description: "Scan a code and jump straight to the next action.",
    adminOnly: false,
  },
  {
    title: "Locations",
    href: "/locations",
    iconName: "MapPinned",
    description: "Warehouses, storage sites, and temporary bases.",
    adminOnly: false,
  },
  {
    title: "Assets",
    href: "/assets",
    iconName: "Package",
    description: "Individual assets, QR codes, status, and history.",
    adminOnly: false,
  },
  {
    title: "Consumables",
    href: "/consumables",
    iconName: "PackageCheck",
    description: "Batch stock, quantities on hand, and stock alerts.",
    adminOnly: false,
  },
  {
    title: "Deployments",
    href: "/deployments",
    iconName: "Truck",
    description: "Deployments, assigned assets, and issued stock.",
    adminOnly: false,
  },
  {
    title: "Maintenance",
    href: "/maintenance",
    iconName: "Wrench",
    description: "Service schedules, records, and due dates.",
    adminOnly: false,
  },
  {
    title: "Reports",
    href: "/reports",
    iconName: "BarChart3",
    description: "Operational reports and exports.",
    adminOnly: false,
  },
  {
    title: "Settings",
    href: "/settings",
    iconName: "Settings",
    description: "Users, categories, and system settings.",
    adminOnly: true,
  },
  {
    title: "Audit",
    href: "/audit",
    iconName: "FileClock",
    description: "System activity and change history.",
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

export const onboardingSteps = [
  {
    title: "Add locations first",
    description: "Create the depots, storage sites, and temporary bases the team actually uses.",
    href: "/locations",
  },
  {
    title: "Set up categories",
    description: "Add asset and consumable categories so staff enter records the same way.",
    href: "/settings",
  },
  {
    title: "Register the first assets",
    description: "Capture vehicles, plant, and gear before worrying about the rest of the register.",
    href: "/assets",
  },
  {
    title: "Track service and stock",
    description: "Then add maintenance schedules, consumable batches, and deployment records.",
    href: "/maintenance",
  },
] as const;
