import { NextResponse } from "next/server";

import type { OfflineMutationRecord } from "@/lib/offline/indexed-db";
import { getPublicEnvStatus } from "@/lib/env";
import { processOfflineMutation } from "@/lib/offline/server-sync";
import { reportOfflineSyncError } from "@/lib/observability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!getPublicEnvStatus().configured) {
    reportOfflineSyncError({
      message: "Offline sync attempted before Supabase configuration was available.",
      mutationId: null,
      status: 503,
    });
    return NextResponse.json({ ok: false, message: "Offline sync is not configured." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    reportOfflineSyncError({
      message: "Offline sync attempted without an authenticated user.",
      mutationId: null,
      status: 401,
    });
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const mutation = (await request.json()) as OfflineMutationRecord;
  const result = await processOfflineMutation(mutation, user.id);

  if (!result.ok) {
    reportOfflineSyncError({
      message: result.message,
      mutationId: mutation.id,
      status: result.status,
    });
    return NextResponse.json(
      {
        ok: false,
        message: result.message,
        conflict: result.status === 409,
        mutationId: mutation.id,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    mutationId: mutation.id,
    serverEntityId: result.recordId,
    serverUpdatedAt: result.updatedAt ?? null,
  });
}
