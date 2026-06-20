import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth";
import { listAssetCategories, listAssets } from "@/lib/assets/server";
import { listConsumableBatches, listConsumableCategories, listConsumableItems } from "@/lib/consumables/server";
import { listLocations } from "@/lib/locations/server";
import type { OfflineBootstrapPayload } from "@/lib/offline/indexed-db";

export async function GET() {
  const user = await getCurrentUserContext();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.role;
  const [locations, assetCategories, consumableCategories, consumableItems, recentAssets, recentConsumableBatches] =
    await Promise.all([
      listLocations(false, role),
      listAssetCategories(false, role),
      listConsumableCategories(false, role),
      listConsumableItems(false, role),
      listAssets({ includeArchived: false }, role),
      listConsumableBatches({ includeArchived: false }, role),
    ]);

  const payload: OfflineBootstrapPayload = {
    generatedAt: new Date().toISOString(),
    referenceData: {
      locations,
      assetCategories,
      consumableCategories,
      consumableItems,
      recentAssets: recentAssets.slice(0, 25),
      recentConsumableBatches: recentConsumableBatches.slice(0, 25),
    },
  };

  return NextResponse.json(payload, {
    headers: {
      "cache-control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
